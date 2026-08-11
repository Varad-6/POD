# Detailed Guide: Deploying Static React Portal to SAP BTP Cloud Foundry

This guide explains how to deploy your fully hardcoded React frontend (including all mock images, files, and logins) directly to an SAP Business Technology Platform (BTP) Cloud Foundry subaccount.

Once deployed, the portal will be accessible globally via a public URL link with no connection to ABAP or backend databases required.

---

### Step 1: Install the Cloud Foundry CLI
You need the Command Line Interface (CLI) to push files to SAP.

1. Download the installer for your OS (Windows):
   * **Direct Download**: [Cloud Foundry CLI v8 Windows 64-bit Zip](https://packages.cloudfoundry.org/stable?release=windows64&version=v8&source=github)
2. Extract the downloaded zip file and run the installer (`cf_cli_installer.exe`).
3. Verify the installation by opening a command prompt or PowerShell and running:
   ```bash
   cf --version
   ```
   *You should see output like: `cf version 8.x.x...`*

---

### Step 2: Build the Portal Files
Before deploying, compile your React code and static assets:

1. Open a command prompt or PowerShell terminal in the project directory (`C:\Users\Varad\Desktop\POD`).
2. Run the production build command:
   ```bash
   npm run build
   ```
3. This creates a `/dist` directory in your project root containing:
   * `index.html`
   * `assets/` (compiled Javascript & CSS)
   * `demo-files/` (all stamped images and invoice PDFs)

---

### Step 3: Create SAP BTP Manifest Config Files
You need to create two configuration files inside your project directory to tell SAP BTP how to host the files.

#### File 1: `Staticfile`
This file tells SAP BTP to run a lightweight, secure Nginx web server to host your files.

1. Create a blank file named `Staticfile` **inside your `/dist` directory**:
   * **In Windows Command Prompt**:
     ```cmd
     type NUL > C:\Users\Varad\Desktop\POD\dist\Staticfile
     ```
   * **In PowerShell**:
     ```powershell
     New-Item -Path "C:\Users\Varad\Desktop\POD\dist\Staticfile" -ItemType File -Force
     ```

#### File 2: `manifest.yml`
This file contains metadata and deployment properties for SAP BTP.

1. Create a new file named `manifest.yml` in the **project root directory** (`C:\Users\Varad\Desktop\POD\manifest.yml`).
2. Paste the following configuration content into it and save:
   ```yaml
   ---
   applications:
     - name: ikwezi-transporter-portal
       memory: 64M
       disk_quota: 128M
       buildpacks:
         - staticfile_buildpack
       path: ./dist
       random-route: true
   ```

---

### Step 4: Login to your SAP BTP Subaccount
1. Log into your **SAP BTP Cockpit** in the browser.
2. Navigate to your **Subaccount** and look at the **Overview** page.
3. Locate the **API Endpoint** (e.g., `https://api.cf.us10.hana.ondemand.com`).
4. In your terminal, run the login command (replace with your API endpoint):
   ```bash
   cf login -a https://api.cf.us10.hana.ondemand.com
   ```
5. Enter your SAP BTP credentials (email and password) when prompted.
6. If you have multiple Organizations or Spaces, select the target space (e.g. `dev`).

---

### Step 5: Push the Application to SAP BTP
Now, push the built application to SAP:

1. Ensure your terminal is in the project root directory (`C:\Users\Varad\Desktop\POD`).
2. Run the push command:
   ```bash
   cf push
   ```
3. SAP BTP will upload the contents of the `/dist` directory, download the `staticfile_buildpack` web server, configure the host environment, and boot up the app.
4. When finished, you will see output like this in your console:
   ```text
   Waiting for app to start...

   name:              ikwezi-transporter-portal
   requested state:   started
   routes:            ikwezi-transporter-portal-random-word-xx.cfapps.us10.hana.ondemand.com
   ```

---

### Step 6: Access and Share the Link
Copy the URL under the **routes:** section in the terminal output. You can open this link in any browser on any device (phone, laptop, client computer) to demo the complete portal!
