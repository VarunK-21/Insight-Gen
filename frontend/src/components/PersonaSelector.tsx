import { useState } from "react";
import { User, Briefcase, Cpu, Building2, Sparkles, PenLine, Scale, TrendingUp, Brain, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export type PersonaType = 'common' | 'accountant' | 'engineer' | 'policy' | 'lawyer' | 'business' | 'data_scientist' | 'product_manager' | 'custom';

export interface CustomPersonaData {
  name: string;
  description: string;
  analyticalFocus: string;
  customPrompt: string;
}

interface Persona {
  id: PersonaType;
  name: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  category: 'general' | 'technical' | 'business';
}

const personas: Persona[] = [
  // General
  {
    id: 'common',
    name: 'Common Citizen',
    title: 'Everyday Impact',
    description: 'Focuses on daily life, jobs, prices, and fairness',
    icon: User,
    color: 'text-persona-common',
    bgColor: 'bg-persona-common/20',
    category: 'general',
  },
  {
    id: 'policy',
    name: 'Policy Strategist',
    title: 'Strategic Focus',
    description: 'Prioritization, sequencing, and trade-offs',
    icon: Building2,
    color: 'text-persona-policy',
    bgColor: 'bg-persona-policy/20',
    category: 'general',
  },
  // Business
  {
    id: 'accountant',
    name: 'Chartered Accountant',
    title: 'Financial Lens',
    description: 'Risk, compliance, predictability, and fiscal stability',
    icon: Briefcase,
    color: 'text-persona-accountant',
    bgColor: 'bg-persona-accountant/20',
    category: 'business',
  },
  {
    id: 'lawyer',
    name: 'Legal Advisor',
    title: 'Compliance View',
    description: 'Legal risks, regulatory compliance, contractual patterns',
    icon: Scale,
    color: 'text-accent',
    bgColor: 'bg-accent/20',
    category: 'business',
  },
  {
    id: 'business',
    name: 'Business Analyst',
    title: 'Market Focus',
    description: 'Revenue drivers, market trends, competitive insights',
    icon: TrendingUp,
    color: 'text-primary',
    bgColor: 'bg-primary/20',
    category: 'business',
  },
  {
    id: 'product_manager',
    name: 'Product Manager',
    title: 'User-Centric',
    description: 'User behavior, feature opportunities, roadmap insights',
    icon: Target,
    color: 'text-persona-policy',
    bgColor: 'bg-persona-policy/20',
    category: 'business',
  },
  // Technical
  {
    id: 'engineer',
    name: 'Systems Engineer',
    title: 'Systems View',
    description: 'Inputs, delays, feedback loops, and bottlenecks',
    icon: Cpu,
    color: 'text-persona-engineer',
    bgColor: 'bg-persona-engineer/20',
    category: 'technical',
  },
  {
    id: 'data_scientist',
    name: 'Data Scientist',
    title: 'Statistical Lens',
    description: 'Statistical patterns, correlations, predictive insights',
    icon: Brain,
    color: 'text-persona-engineer',
    bgColor: 'bg-persona-engineer/20',
    category: 'technical',
  },
  // Custom
  {
    id: 'custom',
    name: 'Custom Persona',
    title: 'Your Perspective',
    description: 'Define your own analytical viewpoint',
    icon: Sparkles,
    color: 'text-accent',
    bgColor: 'bg-accent/20',
    category: 'general',
  },
];

interface PersonaSelectorProps {
  selected: PersonaType | null;
  onSelect: (persona: PersonaType, customData?: CustomPersonaData) => void;
  showCustomFormInitially?: boolean;
}

export const PersonaSelector = ({ selected, onSelect, showCustomFormInitially = false }: PersonaSelectorProps) => {
  const [showCustomForm, setShowCustomForm] = useState(showCustomFormInitially);
  const [customData, setCustomData] = useState<CustomPersonaData>({
    name: '',
    description: '',
    analyticalFocus: '',
    customPrompt: '',
  });

  const handlePersonaSelect = (personaId: PersonaType) => {
    if (personaId === 'custom') {
      setShowCustomForm(true);
      onSelect(personaId);
    } else {
      setShowCustomForm(false);
      onSelect(personaId);
    }
  };

  const handleCustomSubmit = () => {
    if (customData.name && customData.analyticalFocus) {
      onSelect('custom', customData);
    }
  };

  const generalPersonas = personas.filter(p => p.category === 'general' && p.id !== 'custom');
  const businessPersonas = personas.filter(p => p.category === 'business');
  const technicalPersonas = personas.filter(p => p.category === 'technical');
  const customPersona = personas.find(p => p.id === 'custom')!;

  const renderPersonaCard = (persona: Persona) => {
    const Icon = persona.icon;
    const isSelected = selected === persona.id;
    
    return (
      <button
        key={persona.id}
        onClick={() => handlePersonaSelect(persona.id)}
        className={cn(
          "relative p-3 rounded-xl text-left transition-all duration-300 group",
          "border-2",
          isSelected 
            ? persona.id === 'custom'
              ? "border-accent bg-accent/20"
              : `border-current ${persona.bgColor}` 
            : "border-border bg-card hover:border-muted-foreground/30"
        )}
        style={isSelected && persona.id !== 'custom' ? { 
          borderColor: `hsl(var(--persona-${persona.id === 'business' || persona.id === 'product_manager' ? 'policy' : persona.id === 'lawyer' ? 'common' : persona.id === 'data_scientist' ? 'engineer' : persona.id}))` 
        } : undefined}
      >
        <div className="flex items-start gap-2.5">
          <div className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
            isSelected ? persona.bgColor : "bg-secondary group-hover:bg-muted"
          )}>
            <Icon className={cn(
              "w-4 h-4 transition-colors",
              isSelected ? persona.color : "text-muted-foreground group-hover:text-foreground"
            )} />
          </div>
          
          <div className="flex-1 min-w-0">
            <span className={cn(
              "font-display font-semibold text-sm transition-colors block",
              isSelected ? persona.color : "text-foreground"
            )}>
              {persona.name}
            </span>
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
              {persona.description}
            </p>
          </div>
        </div>
        
        {isSelected && (
          <div className={cn(
            "absolute top-2 right-2 w-2 h-2 rounded-full",
            persona.id === 'custom' ? "bg-accent" : persona.bgColor.replace('/20', '')
          )} />
        )}
      </button>
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-display font-semibold text-lg text-foreground">Select Analysis Persona</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Choose a perspective to shape how insights are generated
        </p>
      </div>

      {/* General Personas */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">General</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {generalPersonas.map(renderPersonaCard)}
        </div>
      </div>

      {/* Business Personas */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Business & Legal</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {businessPersonas.map(renderPersonaCard)}
        </div>
      </div>

      {/* Technical Personas */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Technical</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {technicalPersonas.map(renderPersonaCard)}
        </div>
      </div>

      {/* Custom Persona */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Custom</p>
        {renderPersonaCard(customPersona)}
      </div>

      {/* Custom Persona Form */}
      {showCustomForm && selected === 'custom' && (
        <div className="mt-4 p-5 rounded-xl bg-card border-2 border-accent/50 space-y-4 animate-slide-up">
          <div className="flex items-center gap-2 mb-2">
            <PenLine className="w-5 h-5 text-accent" />
            <h4 className="font-display font-semibold text-foreground">Define Your Custom Persona</h4>
          </div>
          
          <div className="grid gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Persona Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g., Healthcare Administrator, Startup Founder, Environmental Analyst"
                value={customData.name}
                onChange={(e) => setCustomData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-background border-border"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Description
              </label>
              <Input
                placeholder="Brief description of who this persona is"
                value={customData.description}
                onChange={(e) => setCustomData(prev => ({ ...prev, description: e.target.value }))}
                className="bg-background border-border"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Analytical Focus <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g., Cost optimization, Patient outcomes, Revenue growth, Sustainability metrics"
                value={customData.analyticalFocus}
                onChange={(e) => setCustomData(prev => ({ ...prev, analyticalFocus: e.target.value }))}
                className="bg-background border-border"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                What do you want from this analysis?
              </label>
              <Textarea
                placeholder="Describe what insights you're looking for, specific questions you want answered, or aspects of the data you want to focus on..."
                value={customData.customPrompt}
                onChange={(e) => setCustomData(prev => ({ ...prev, customPrompt: e.target.value }))}
                className="bg-background border-border min-h-[100px]"
              />
            </div>
          </div>
          
          <Button 
            onClick={handleCustomSubmit}
            disabled={!customData.name || !customData.analyticalFocus}
            className="w-full bg-accent hover:bg-accent/90 text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Apply Custom Persona
          </Button>
        </div>
      )}
    </div>
  );
};