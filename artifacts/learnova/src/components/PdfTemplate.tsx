import React from 'react';
import Markdown from 'react-markdown';
import { Github, Globe, Code } from 'lucide-react';

interface PdfTemplateProps {
  topic: string;
  notes: string;
}

export const PdfTemplate: React.FC<PdfTemplateProps> = ({ topic, notes }) => {
  return (
    <div id="pdf-template" className="w-[800px] bg-white relative p-10 pb-40">

      {/* Top Graphic */}
      <div className="absolute top-0 left-0 w-full flex">
         <div className="h-4 w-3/4 bg-[#0D3B94] rounded-br-full"></div>
         <div className="h-4 w-1/4 bg-[#FFB300] rounded-bl-full -ml-8"></div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mt-6">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Learnova" className="w-20 h-20 object-contain" />
          <div>
            <span className="text-4xl font-bold text-[#0D3B94]">
              Lear<span className="text-[#FFB300]">nova</span>
            </span>
            <p className="text-[#0D3B94] text-sm mt-1 border-t border-[#0D3B94] pt-1">— Learn Smarter, Achieve Better —</p>
          </div>
        </div>

        {/* Quote Block */}
        <div className="border-l-4 border-t-4 border-b-4 border-[#0D3B94] border-r-4 rounded-tr-3xl rounded-bl-3xl p-4 max-w-xs relative">
          <div className="text-3xl text-[#0D3B94] absolute -top-5 left-2 bg-white px-1">"</div>
          <p className="text-sm font-medium text-slate-800 text-center leading-relaxed">
            The beautiful thing about <span className="text-[#0D3B94]">learning</span> is that no one can take it away from <span className="text-[#FFB300]">you</span>.
          </p>
          <div className="text-3xl text-[#FFB300] absolute -bottom-5 right-2 bg-white px-1">"</div>
        </div>
      </div>

      <div className="w-full h-0.5 bg-[#FFB300] my-8"></div>

      {/* Notes Content */}
      <div className="prose prose-slate max-w-none">
        <h1 className="text-2xl font-bold text-[#0D3B94] mb-4">{topic}</h1>
        <Markdown>{notes}</Markdown>
      </div>

      {/* Footer Graphic & Info */}
      <div className="absolute bottom-0 left-0 w-full flex flex-col mt-20">
         <div className="w-full h-0.5 bg-[#0D3B94] mb-4"></div>
         <div className="flex justify-between items-center px-10 mb-8">

            {/* Copyright */}
            <div className="flex flex-col gap-1">
               <div className="flex items-center gap-2 text-[#0D3B94] font-bold">
                 <span>©</span>
                 <span>Learnova.co.in</span>
               </div>
               <div className="flex items-center gap-2 text-xs text-slate-600">
                 <span className="text-[#0D3B94]">♥</span>
                 <span>Made with love in India</span>
               </div>
            </div>

            {/* GitHub */}
            <div className="flex items-center gap-2">
               <div className="w-10 h-10 bg-[#0D3B94] flex items-center justify-center text-white rounded-md">
                 <Github className="w-6 h-6" />
               </div>
               <div className="flex flex-col">
                 <span className="text-xs font-bold text-slate-800">GitHub</span>
                 <span className="text-xs text-[#0D3B94]">github.com/CoffeetoCode26</span>
               </div>
            </div>

            {/* Website */}
            <div className="flex items-center gap-2">
               <div className="w-10 h-10 bg-[#0D3B94] rounded-full flex items-center justify-center text-white">
                 <Globe className="w-6 h-6" />
               </div>
               <div className="flex flex-col">
                 <span className="text-xs font-bold text-slate-800">Visit Our Website</span>
                 <span className="text-xs text-[#0D3B94]">Learnova.vercel.app</span>
               </div>
            </div>

            {/* Coffee To Code */}
            <div className="flex items-center gap-2">
               <div className="w-10 h-10 bg-[#5C3A21] rounded-lg flex items-center justify-center text-white relative">
                 <Code className="w-6 h-6 text-[#FFB300]" />
               </div>
               <div className="flex flex-col">
                 <span className="text-xs font-bold text-slate-800">A Part Of</span>
                 <span className="text-xs font-bold text-slate-800">Coffee To Code</span>
               </div>
            </div>

         </div>

         {/* Bottom waves */}
         <div className="flex w-full relative h-8 overflow-hidden">
             <div className="absolute top-2 w-[120%] -left-[10%] h-12 bg-[#FFB300] rounded-t-[100%]"></div>
             <div className="absolute top-4 w-[110%] -left-[5%] h-12 bg-[#0D3B94] rounded-t-[100%]"></div>
         </div>
      </div>

    </div>
  );
};
