// ============================================================
// POD — SAP Adapter Factory
// Returns active SAP adapter based on VITE_SAP_MODE environment setting.
// ============================================================

import type { ISAPAdapter } from './ISAPAdapter';
import { MockSAPAdapter } from './MockSAPAdapter';
import { S21SAPAdapter } from './S21SAPAdapter';

export function getSAPAdapter(): ISAPAdapter {
  const mode = import.meta.env.VITE_SAP_MODE;
  if (mode === 'LIVE') {
    console.info('[SAP Adapter Factory] Operating in LIVE mode with S21SAPAdapter');
    return S21SAPAdapter;
  }
  console.info('[SAP Adapter Factory] Operating in MOCK mode with MockSAPAdapter');
  return MockSAPAdapter;
}

export { MockSAPAdapter } from './MockSAPAdapter';
export { S21SAPAdapter } from './S21SAPAdapter';
export type { ISAPAdapter } from './ISAPAdapter';
