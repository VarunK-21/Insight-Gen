import { BookOpen, Brain, Users, BarChart3, Lightbulb, Target, Layers, CheckCircle2 } from "lucide-react";

const steps = [
  {
    icon: Layers,
    title: "Data Ingestion",
    description: "Your CSV dataset is parsed and structured for analysis. We extract column headers, identify data types, and prepare the data for AI processing.",
  },
  {
    icon: Users,
    title: "Persona Selection",
    description: "Choose an analytical lens through which to view your data. Each persona brings unique perspectives, priorities, and concerns to the analysis.",
  },
  {
    icon: Brain,
    title: "AI Analysis",
    description: "Our advanced OpenAI models analyze your data through the selected persona's perspective, identifying patterns, anomalies, and key insights.",
  },
  {
    icon: BarChart3,
    title: "Insight Generation",
    description: "The AI generates actionable insights, identifies trends, and suggests visualizations tailored to the persona's typical needs and interests.",
  },
];

const personas = [
  {
    name: "Common Person",
    color: "bg-persona-common",
    description: "Focuses on practical, everyday implications. Looks for information that affects daily life, personal finances, and community impact.",
    questions: ["How does this affect me?", "What's the bottom line?", "Is this good or bad news?"],
  },
  {
    name: "Accountant",
    color: "bg-persona-accountant",
    description: "Analyzes financial metrics, cost implications, and budget considerations. Identifies fiscal patterns and monetary trends.",
    questions: ["What are the cost implications?", "Where's the ROI?", "What's the financial risk?"],
  },
  {
    name: "Engineer",
    color: "bg-persona-engineer",
    description: "Examines technical feasibility, system performance, and optimization opportunities. Focuses on efficiency and scalability.",
    questions: ["How can this be optimized?", "What are the technical constraints?", "Is this scalable?"],
  },
  {
    name: "Policy Maker",
    color: "bg-persona-policy",
    description: "Evaluates regulatory implications, societal impact, and governance considerations. Thinks about long-term systemic effects.",
    questions: ["What are the policy implications?", "How does this affect different groups?", "What regulations apply?"],
  },
];

const Methodology = () => {
  return (
    <div className="relative">
      {/* Header */}
      <div className="relative py-12 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(173_80%_45%/0.1),transparent_50%)]" />
        
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Our Approach</span>
          </div>
          
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            The
            <span className="gradient-text"> Methodology</span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Understand how we transform raw data into perspective-driven insights using advanced AI.
          </p>
        </div>
      </div>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
          How It Works
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className="glass-card rounded-2xl p-6 relative overflow-hidden group hover:border-primary/30 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-primary">STEP {index + 1}</span>
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Personas Explained */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4 text-center">
          Understanding Personas
        </h2>
        <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-10">
          Each persona represents a distinct analytical framework, bringing unique questions and priorities to your data.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          {personas.map((persona, index) => (
            <div
              key={index}
              className="glass-card rounded-2xl p-6 hover:border-primary/30 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-4 h-4 rounded-full ${persona.color}`} />
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {persona.name}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {persona.description}
              </p>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Key Questions
                </p>
                {persona.questions.map((question, qIndex) => (
                  <div key={qIndex} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{question}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AI Technology */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="glass-card rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
              <Target className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
              Powered by Advanced AI
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Our system leverages OpenAI models to provide nuanced, context-aware analysis 
              of your datasets. The AI understands the unique perspective of each persona and tailors 
              its insights accordingly, ensuring you receive relevant and actionable information.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Methodology;
