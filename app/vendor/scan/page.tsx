import { ScannerBox } from "./components";

export const instant = false;

export default function VendorQRScannerPage() {
  return (
    <div className="w-full p-6">
      <div className="w-full max-w-3xl mx-auto">
        <ScannerBox />
      </div>
    </div>
  );
}