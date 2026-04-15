import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

export function AIPromptWidget({ onGenerated }: { onGenerated: (text: string) => void }) {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) return;
    setGenerating(true);
    
    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockOutput = `A premium quality ${prompt} designed to meet top industry standards. Featuring durable materials and intuitive design.`;
    onGenerated(mockOutput);
    setGenerating(false);
  };

  return (
    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-md mb-4 flex items-start gap-4">
      <div className="bg-indigo-100 p-2 rounded-full text-indigo-600 mt-1">
        <Sparkles className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-indigo-900 mb-1">AI Description Generator</h3>
        <p className="text-sm text-indigo-700 mb-3">
          Enter keywords to generate a professional product description.
        </p>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="e.g. Wireless Mouse, Red" 
            className="flex-1 text-sm rounded border-indigo-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button 
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-indigo-700 transition flex items-center justify-center min-w-[100px]"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
}
