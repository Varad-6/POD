# Complete Start-to-Finish SAP BTP Deployment Guide

This guide contains the exact command-by-command instructions to configure, build, and deploy your static React portal to SAP Business Technology Platform (BTP).

---

## Part 1: Install the Cloud Foundry CLI Tool
Before you run any commands, you must install the SAP BTP command line tool.

1. **Download the Installer**:
   Click this link to download the zip file: [Cloud Foundry CLI v8 (64-bit installer)](https://packages.cloudfoundry.org/stable?release=windows64&version=v8&source=github).
2. **Install**:
   * Open the downloaded `.zip` file.
   * Double-click `cf_cli_installer.exe` and complete the installation wizard.
3. **Verify Installation**:
   Open a new PowerShell terminal and run:
   ```powershell
   cf --version
   ```
   *You must see a version number output (e.g. `cf version 8.x.x`)*.

---

## Part 2: Generate the Production Files
First, we compile all TypeScript, HTML, and styling files into static browser assets.

1. Open **PowerShell** or **Command Prompt**.
2. Navigate to your project directory (Do NOT use `cd` inside the AI assistant terminal, run this in your local machine terminal):
   ```cmd
   cd C:\Users\Varad\Desktop\POD
   ```
3. Run the production build command:
   ```cmd
   npm run build
   ```
   *This command compiles the files and puts them in a new folder named `C:\Users\Varad\Desktop\POD\dist`.*

---

## Part 3: Create the Config Files
We must create two files so SAP BTP knows how to serve our static images and web portal.

### 1. Create the `Staticfile`
This blank file tells the SAP BTP container to start a lightweight web server (Nginx) to host the static folder.

Run this exact command in your PowerShell terminal to create a blank file named `Staticfile` directly inside the build directory:
```powershell
New-Item -Path "C:\Users\Varad\Desktop\POD\dist\Staticfile" -ItemType File -Force
```

### 2. Create the `manifest.yml`
This file defines the memory allotment, directory path, and route configuration for SAP BTP.

Run this command in PowerShell to create the `manifest.yml` file in your root folder:
```powershell
New-Item -Path "C:\Users\Varad\Desktop\POD\manifest.yml" -ItemType File -Force
```

Now, open the newly created file `C:\Users\Varad\Desktop\POD\manifest.yml` in Notepad or VS Code, paste the exact block below, and save the file:
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

## Part 4: Log In to your SAP BTP Cockpit
To push the application, you must connect the CLI to your SAP Cloud Foundry account.

1. Open your browser and log into the [SAP BTP Cockpit](https://cockpit.hanatrial.ondemand.com/cockpit/).
2. Click on your **Subaccount** tile.
3. Look at the **Overview** tab page in the Cockpit.
4. Locate the line named **API Endpoint**. It will look similar to this:
   `https://api.cf.us10.hana.ondemand.com`
   *(Copy this endpoint URL)*.
5. In your local terminal, run the login command (replace with your exact endpoint URL):
   ```bash
   cf login -a https://api.cf.us10.hana.ondemand.com
   ```
6. Enter your SAP account email and password when prompted.
7. If the CLI asks to select an **Organization** or a **Space** (e.g. `dev`), enter the number corresponding to your choice.

---

## Part 5: Push and Deploy to BTP Cloud
Now, execute the upload to publish your application:

1. Make sure your local terminal is in the project root directory:
   ```cmd
   cd C:\Users\Varad\Desktop\POD
   ```
2. Run the deployment command:
   ```bash
   cf push
   ```
3. Wait for the terminal to finish the upload. You will see progress logs.
4. When finished, look at the bottom of the output for the line named **`routes:`**. It will look like this:
   ```text
   routes: ikwezi-transporter-portal-active-zebra-xy.cfapps.us10.hana.ondemand.com
   ```
5. Copy the route link (prefix it with `https://`), paste it into any web browser, and access your live, stamped transporter demo!
