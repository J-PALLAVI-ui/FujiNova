import React from 'react';
import { Check, TreePine, Mountain, Clock } from 'lucide-react';

interface HanaDecisionAssistantProps {
  destinationName?: string;
  onSelectOption?: (optionId: string) => void;
  selectedOption?: string;
}

export const HanaDecisionAssistant: React.FC<HanaDecisionAssistantProps> = ({
  destinationName = "Chureito Pagoda",
  onSelectOption,
  selectedOption
}) => {
  const options = [
    {
      id: "visit_anyway",
      code: "A",
      title: "A. Visit it anyway",
      subtitle: `Keep ${destinationName} in your plan.`,
      icon: Check,
      bgColor: "bg-[#E9A5B5]/15",
      borderColor: "border-[#E9A5B5]",
      textColor: "text-[#A83F70]"
    },
    {
      id: "quieter_place",
      code: "B",
      title: "B. Find a quieter place with a similar experience",
      subtitle: "Discover peaceful viewpoints with fewer crowds.",
      icon: TreePine,
      bgColor: "bg-[#789477]/15",
      borderColor: "border-[#789477]",
      textColor: "text-[#789477]"
    },
    {
      id: "famous_alternative",
      code: "C",
      title: "C. Find another famous attraction with lower crowds",
      subtitle: "Explore iconic landmarks with open capacity.",
      icon: Mountain,
      bgColor: "bg-[#B99BCB]/15",
      borderColor: "border-[#B99BCB]",
      textColor: "text-[#87365E]"
    },
    {
      id: "later_time",
      code: "D",
      title: "D. Keep it for later in the day",
      subtitle: "Visit in the late afternoon when foot traffic drops.",
      icon: Clock,
      bgColor: "bg-[#C66B4E]/15",
      borderColor: "border-[#C66B4E]",
      textColor: "text-[#C66B4E]"
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#EAD7C8] shadow-sm p-4 sm:p-5">
      {/* Hana Avatar & Message */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-[#E9A5B5] shadow-xs">
          <img 
            src="https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&auto=format&fit=crop&q=80" 
            alt="Hana AI" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#29252B]">Hana</span>
            <span className="text-[10px] bg-[#E9A5B5]/25 text-[#A83F70] font-bold px-2 py-0.5 rounded-full">
              AI Travel Companion
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#403944] mt-1 font-medium">
            This destination appears busy right now. Would you prefer to:
          </p>
        </div>
      </div>

      {/* 4 Decision Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selectedOption === opt.id;

          return (
            <button
              key={opt.id}
              onClick={() => onSelectOption?.(opt.id)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                isSelected 
                  ? 'border-2 border-[#87365E] bg-[#F7EFE5] shadow-xs' 
                  : `${opt.borderColor} hover:bg-[#FAF5F0] bg-white`
              }`}
            >
              <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${opt.bgColor} ${opt.textColor}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-xs text-[#29252B] leading-tight">{opt.title}</h4>
                <p className="text-[11px] text-[#625966] mt-0.5 leading-snug">{opt.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
