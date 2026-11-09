"use client";

import React, { useState } from 'react';
import { Pencil, SlidersHorizontal, Info, Upload, X, Check } from 'lucide-react';

interface Product {
  id: string;          
  code: string;        
  name: string;        
  price: number;       
  status: 'available' | 'closed'; 
  category: string;    
  description: string; 
  imageUrl: string;    
}

export default function ProductManagement() {
  
  return (
    
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-800">
      
     
      <h1>ทดสอบหน้า Product Management</h1>
      
    </div>
  );
}