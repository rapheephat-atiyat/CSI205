"use client";


import { ScannerBox, PaymentSummary } from "./components";

export default function page() {
    return (

        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 mt-5"> QR Scanner</h1>
                <p className="text-xs text-slate-400 mt-1">ตรวจสอบจำนวน สแกน QR และยืนยันรับชำระ Token</p>
            </div>

            <div className=" bg-white  border border-slate-200/80 p-6 shadow-sm ">
                สแกน QR เพื่อรับชำระ

                <div className="p-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-slate-900 mt-5">QR Scanner</h1>
                    </div>

                    {/* 3. เอา Component มาวางประกอบกัน */}
                    <div className="col-span-1 md:col-span-8">
                        <ScannerBox />
                        <PaymentSummary />
                    </div>



                </div>


            </div>

            
        </div>

    );
}

