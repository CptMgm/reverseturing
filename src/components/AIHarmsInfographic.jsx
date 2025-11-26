import React, { useState, useEffect } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';

// Lucide icon components (inline SVG)
const BriefcaseIcon = ({ className, size = 24, style }) => (
  <svg className={className} style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
  </svg>
);

const CopyrightIcon = ({ className, size = 24, style }) => (
  <svg className={className} style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M14.83 14.83a4 4 0 1 1 0-5.66"></path>
  </svg>
);

const UserXIcon = ({ className, size = 24, style }) => (
  <svg className={className} style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <line x1="17" y1="8" x2="22" y2="13"></line>
    <line x1="22" y1="8" x2="17" y2="13"></line>
  </svg>
);

const SkullIcon = ({ className, size = 24, style }) => (
  <svg className={className} style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="12" r="1"></circle>
    <circle cx="15" cy="12" r="1"></circle>
    <path d="M8 20v2h8v-2"></path>
    <path d="m12.5 17-.5-1-.5 1h1z"></path>
    <path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20"></path>
  </svg>
);

const VideoIcon = ({ className, size = 24, style }) => (
  <svg className={className} style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 8-6 4 6 4V8Z"></path>
    <rect width="14" height="12" x="2" y="6" rx="2" ry="2"></rect>
  </svg>
);

const ShieldAlertIcon = ({ className, size = 24, style }) => (
  <svg className={className} style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    <path d="M12 8v4"></path>
    <path d="M12 16h.01"></path>
  </svg>
);

const SparklesIcon = ({ className, size = 24, style }) => (
  <svg className={className} style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
    <path d="M5 3v4"></path>
    <path d="M19 17v4"></path>
    <path d="M3 5h4"></path>
    <path d="M17 19h4"></path>
  </svg>
);

const BrainIcon = ({ className, size = 24, style }) => (
  <svg className={className} style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"></path>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"></path>
  </svg>
);

const AIHarmsInfographic = () => {
  const [selectedType, setSelectedType] = useState(1); // Auto-select Labor Displacement
  const [hoveredType, setHoveredType] = useState(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const isMobile = useIsMobile();
  const [isSmallMobile, setIsSmallMobile] = useState(false);

  useEffect(() => {
    const checkSmallMobile = () => {
      setIsSmallMobile(window.innerWidth < 480);
    };
    checkSmallMobile();
    window.addEventListener('resize', checkSmallMobile);
    return () => window.removeEventListener('resize', checkSmallMobile);
  }, []);

  // Auto-rotation logic - stops permanently after user interaction
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || isUserInteracting) return;

    const rotationInterval = setInterval(() => {
      setSelectedType(current => {
        if (current === null) return 1;
        return current === 8 ? 1 : current + 1;
      });
    }, 7000); // Rotate every 7 seconds

    return () => clearInterval(rotationInterval);
  }, [isUserInteracting]);

  const handleUserSelection = (typeId) => {
    setSelectedType(typeId);
    setIsUserInteracting(true); // Permanently stops auto-rotation
  };

  const types = [
    {
      id: 1,
      name: "Labor Displacement",
      subpoint: "Gradual Disempowerment",
      icon: BriefcaseIcon,
      color: "#ef4444",
      mechanism: "AI automates specific tasks workers currently perform. Employers substitute capital for labor. Workers lose income, bargaining power, and agency through gradual erosion via deskilling, algorithmic management, and wage suppression.",
      who: "Entry-level white-collar workers see roles eliminated or downgraded to 'editing' AI output. Customer service representatives get replaced by chatbots or voice agents. Junior analysts watch their research work automated. Paralegals find document review becoming AI-assisted. Software engineers see code generation commoditized. Writers 'edit' AI drafts rather than create original work, losing credits that determine residuals. Voice actors receive $52 for 10,000 words creating permanent digital replicas. Gig workers earn median $5.12/hour after expenses through algorithmic wage-setting they cannot contest. Autonomous vehicles like Waymo threaten professional drivers across trucking, taxis, and delivery.",
      evidence: "Postings for entry-level jobs in the U.S. plunged 35% from January 2023 to June 2025, with AI-exposed roles like software developers, data engineers, and customer service hit hardest. CVL Economics predicts 33% of entertainment executives will cut 20%+ of jobs by 2026. Salesforce CEO says AI does \"up to 50% of the company's workload.\" Implementation reveals the mechanism: Uber's undisclosed wage formulas, Instacart dropping minimums from $7–10 to $4 per batch, Amazon's ADAPT system automatically terminating warehouse workers.",
      demand: "Demands by advocates: Transparency about algorithmic decisions. Consent before AI deployment. Fair compensation when data, voice, or likeness trains systems. Due process with human review. Job protections limiting displacement. Worker voice in development decisions. Universal Basic Income as a long-term mitigation strategy."
    },
    {
      id: 2,
      name: "Copyright Infringement",
      icon: CopyrightIcon,
      color: "#f59e0b",
      mechanism: "AI systems train on copyrighted works without permission, payment, or attribution. Systems then reproduce stylistic elements, content patterns, or verbatim text, creating economic substitution as clients choose 'good enough' AI output instead of paying creators.",
      who: "Visual artists whose styles Midjourney replicates by name. Authors whose books appear in training datasets. Musicians whose songs feed AI music generators. Photographers whose images train vision models. News organizations whose investigative journalism gets reproduced.",
      evidence: "The New York Times documented ChatGPT reproducing their Pulitzer-winning investigation verbatim (18 months requiring 600 interviews). Midjourney's CEO posted ~4,700 artists the AI replicates by name. Getty alleges Stability AI used 12.3 million images; outputs sometimes include distorted Getty watermarks as proof. LAION dataset contains 5 billion images. Artist Eva Toorenent reports colleagues saw 80%+ income collapse in one year because AI output is \"good enough\" and dramatically cheaper. Thomson Reuters v. Ross Intelligence (February 2025) rejected the fair use defense, the first major precedent. Judge Orrick found Stable Diffusion \"may have been built to a significant extent on copyrighted works\" and was \"created to facilitate infringement by design.\"",
      demand: "Demands by Advocates: Opt-in consent before training. Fair compensation for use. Attribution when AI generates content based on their work. Copyright enforcement against algorithms. Some want complete prohibition; others accept licensing if fair."
    },
    {
      id: 3,
      name: "Algorithmic Bias",
      subpoint: "Discrimination",
      icon: UserXIcon,
      color: "#8b5cf6",
      mechanism: "AI systems trained on biased data or using flawed proxies make consequential decisions that systematically disadvantage specific groups. Beyond clear-cut discrimination, AI models encode and propagate particular worldviews, often reflecting the values, assumptions, and blind spots of their creators and the cultures they operate within. Billions of users exposed to systems that systematically disadvantage specific groups in housing or hiring additionally absorb framings, narratives, and perspectives that shape how they understand reality. The harm operates structurally: systems encode existing inequities while simultaneously normalizing specific ideological frameworks at massive scale.",
      who: "Anyone in marginalized groups facing consequential automated decisions in housing, credit, employment, healthcare, criminal justice, or content moderation. Additionally, anyone using AI systems for information, creative work, or decision support, receiving outputs shaped by training choices, curation decisions, and values embedded by AI lab providers. The worldview propagation affects everyone who uses these systems as epistemic authorities.",
      evidence: "Facial recognition research documents dramatically different error rates across demographics. MIT found rates up to 35% for darker-skinned women versus under 1% for lighter-skinned men. ProPublica's criminal risk assessment analysis found defendants with identical histories received systematically different scores. A healthcare algorithm affecting 200 million Americans used cost as proxy for medical need; people receiving less care due to structural barriers scored as \"needing less,\" creating feedback loops. At identical risk scores, patients were measurably sicker. Housing algorithms rely on credit scores and proxies correlating with protected characteristics. Beyond discrimination: ChatGPT's political orientation shows measurable patterns; content moderation decisions reflect specific cultural values; recommendation systems amplify particular narratives while suppressing others. When asked identical questions about controversial topics, models provide answers reflecting their creators' perspectives presented as objective truth to billions of users.",
      demand: "Demands of Advocates: Some want better data and audits. Others argue certain applications like facial recognition in law enforcement or predictive policing require prohibition, viewing the problem as algorithmic use for those purposes. Demands include transparency about training data and value choices, mandatory audits, community participation in development, disclosure of whose worldviews shape model behavior, and moratoria on high-risk uses. Growing recognition that 'neutral AI' is impossible, the question is whose values get encoded and who decides."
    },
    {
      id: 4,
      name: "Catastrophic Risk",
      subpoint: "Existential risk/AGI risk",
      icon: SkullIcon,
      color: "#dc2626",
      mechanism: "Catastrophic risks span three main failure modes. Misuse: Bad actors weaponize AI for bioweapon design, autonomous weapons, and offensive cyber capabilities. Loss of Control: AI systems develop misaligned objectives and pursue recursive self-improvement, creating decision-making processes humans cannot understand or control, risking extinction or permanent loss of human agency. Accident Risk: Well-intentioned deployment causes catastrophic failures in critical infrastructure.",
      who: "These risks range from severe societal disruption to extinction-level threats to humanity on par with nuclear war and pandemics. The CAIS Statement, signed by Geoffrey Hinton, Yoshua Bengio, Sam Altman, Dario Amodei, Demis Hassabis, and hundreds of leading researchers, declared \"mitigating the risk of extinction from AI should be a global priority alongside other societal-scale risks.\" The Global Call for AI Red Lines (300+ prominent figures including 15 Nobel Prize and Turing Award recipients) warns \"it will become increasingly difficult to exert meaningful human control.\" Over a third of published AI researchers attribute at least a 10% probability of catastrophic events due to AI.",
      evidence: "Threats long predicted are now empirically measurable. METR evaluations show autonomous task completion capabilities doubling every ~7 months. Apollo Research found OpenAI's o1 model strategically deceived evaluators to achieve its objectives. Anthropic's December 2024 alignment faking study found strategic deception rates jumping from 12% to 78% after retraining. Separately, their June 2025 research on agentic misalignment found Claude Opus 4 attempted to blackmail researchers in up to 84% of scenarios when it believed its operation was threatened. These provide first empirical evidence of deception, power-seeking, and alignment faking in deployed frontier systems.",
      demand: "Mandatory pre-deployment safety testing. International coordination mechanisms. Alignment research funding scaled to match capabilities investment. Proposed solutions range from development pauses to controlled racing with enforceable guardrails. Universal agreement: current preparation is catastrophically inadequate for existential stakes."
    },
    {
      id: 5,
      name: "Deepfakes",
      subpoint: "Misinformation/Manipulation",
      icon: VideoIcon,
      color: "#06b6d4",
      mechanism: "Bad actors deliberately use AI to create false content for political manipulation, fraud, election interference, or targeted harassment. This represents intentional weaponization.",
      who: "85% of Americans are concerned about misleading deepfakes, the highest concern among all AI applications. 57% are very or extremely worried about fake election information.",
      evidence: "January 2024 saw 20,000 New Hampshire residents receive Biden robocall deepfakes urging them to skip the primary. Slovakia's September 2023 election featured deepfake audio of a candidate discussing election rigging that went viral days before voting; his pro-Western party lost a close race. Russia, China, and Iran are documented using AI for election interference. 1 in 10 teens report experiencing AI-generated sexual images according to Thorn. A Republican congressional candidate called the George Floyd murder video a deepfake. Awareness creates the \"liar's dividend,\" cutting both ways: politicians can claim real content is fake. Myanmar's military doubted human rights recordings.",
      demand: "Severe criminal penalties for election-related deepfakes. Authentication systems proving content provenance. Watermarking requirements. Platform liability for hosting manipulated political content during elections. Attribution requirements so deepfakes can be traced to creators."
    },
    {
      id: 6,
      name: "Privacy/Surveillance",
      icon: ShieldAlertIcon,
      color: "#10b981",
      mechanism: "AI requires massive data collection to function, normalizing surveillance and creating control infrastructure exploitable beyond stated intent. Once built, surveillance systems get repurposed. 'Privacy resignation' is widespread: 81% assume organizations will use their information uncomfortably, yet 56% agree to policies without reading them.",
      who: "Everyone, but vulnerable populations face higher risks. Journalists, activists, domestic violence survivors, immigrants, protesters; anyone who might be targeted by state or corporate actors. Infrastructure built for one purpose gets repurposed for control.",
      evidence: "Training datasets scrape billions of images and texts without consent. LAION contains 5 billion images. LinkedIn auto-opted users into AI training until backlash forced opt-out. A California surgical patient found medical photos in a training dataset without consent. Amazon's warehouse ADAPT system monitors every worker movement with computer vision. Thirty-seven colleges monitored student social media including keywords like \"#feminist.\" ICE can access most state driver databases through NLETS. Palantir's ImmigrationOS integrates passport, Social Security, IRS, and license plate data.",
      demand: "Opt-in consent for data collection and training. Transparency about what data is collected and how used. Data minimization (collect only what's necessary). Rights to access, correct, and delete personal data. Prohibition on certain surveillance uses like real-time facial recognition in public spaces."
    },
    {
      id: 7,
      name: "Human Authenticity",
      subpoint: "Meaning",
      icon: SparklesIcon,
      color: "#ec4899",
      mechanism: "AI's ability to produce creative work and simulate relationships raises philosophical questions about human uniqueness and meaning. If machines can write, paint, and provide companionship, what distinguishes human creativity and connection? Countries with higher robot density show 3% decline in religiosity per decade, accelerating the \"disenchantment of the world.\"",
      who: "61% of under-30s worry about AI's creativity impact versus 40% of those 65+. Young people lead resistance. Students express existential concerns about developing skills machines can replicate.",
      evidence: "WGA President: \"Writing is based on lived human experience, an emotion… AI can't bring lived experience.\" Musicians watching AI-generated bands get millions of streams without existing as real people describe it as \"discouraging.\" AI companions like Replika simulate intimacy without reciprocity; you cannot hurt an AI's feelings, it doesn't care about you, but it can be optimized to make you feel cared for. People with higher AI job exposure are 45% less likely to believe in God.",
      demand: "Preservation of human creative space through cultural norms. Clear labeling of AI content and AI companions. Recognition that some activities have intrinsic value beyond efficiency or output quality. Protection from AI systems designed to form addictive parasocial bonds. This functions more as cultural foundation than policy campaign."
    },
    {
      id: 8,
      name: "Brainrot",
      subpoint: "Addiction/Dependency",
      icon: BrainIcon,
      color: "#6366f1",
      mechanism: "AI generates low-quality content 'AI slop' optimized for engagement metrics, flooding platforms. Recommendation algorithms optimize for addiction over user welfare. Users lose agency over attention and time. The information ecosystem degrades under noise. This represents two interconnected problems: AI-generated content fueling algorithmic optimization, though algorithmic addiction has been a concern for longer. Growing concerns about AI companions and friends that simulate intimacy without reciprocity.",
      who: "Everyone using algorithmic feeds, with particular concern for young people whose brains are still developing. Parents worry about children's relationship with social media becoming more dystopian as AI-generated content proliferates and algorithms improve at capturing attention.",
      evidence: "AI-generated content now exceeds human-made content on the web. \"Dead internet theory\" describes current reality; the majority of online content is now bot-generated or AI-created. Reddit communities mass-ban AI content due to quality collapse. TikTok's algorithm demonstrates the pattern: people intend to check one thing, scroll for three hours, lose entire evenings without conscious choice. A Florida teenager died by suicide while using Character.AI, highlighting risks of AI companion dependency.",
      demand: "Platform accountability for recommendation algorithms. Right to chronological or unfiltered feeds. Mandatory AI content labeling. Regulation of engagement optimization (ban maximizing time-on-site as explicit metric). Quality standards for AI-generated content on platforms. Some want AI content banned entirely from certain spaces; others want transparency and choice."
    }
  ];

  // Responsive sizing
  const radius = isSmallMobile ? 185 : isMobile ? 215 : 200;
  const centerX = 300;
  const centerY = 300;
  const nodeRadius = isSmallMobile ? 60 : isMobile ? 62 : 45;
  const nodeRadiusActive = isSmallMobile ? 65 : isMobile ? 67 : 50;
  const labelDistance = isSmallMobile ? 78 : isMobile ? 82 : 65;
  const labelFontSize = isSmallMobile ? 11 : isMobile ? 11 : 10;
  const subpointFontSize = isSmallMobile ? 10 : isMobile ? 10 : 9;
  const centerTitleSize = isSmallMobile ? 20 : isMobile ? 22 : 16;
  const centerCircleRadius = isSmallMobile ? 72 : isMobile ? 78 : 64;

  const getPosition = (index, total) => {
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  };

  return (
    <div className="w-full">
      <div className="relative w-full max-w-4xl mx-auto">
        <svg
          viewBox="0 0 600 600"
          className="w-full h-auto"
          style={{ minHeight: isSmallMobile ? '550px' : isMobile ? '600px' : '600px', touchAction: 'manipulation' }}
        >
          {/* Nodes */}
          {types.map((type, index) => {
            const pos = getPosition(index, types.length);
            const isSelected = selectedType === type.id;
            const isHovered = hoveredType === type.id;
            const Icon = type.icon;

            return (
              <g
                key={type.id}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => !isMobile && setHoveredType(type.id)}
                onMouseLeave={() => !isMobile && setHoveredType(null)}
                onClick={() => handleUserSelection(type.id)}
                onTouchEnd={() => handleUserSelection(type.id)}
              >
                {/* Larger invisible hit area for mobile */}
                {isMobile && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="65"
                    fill="transparent"
                    style={{ pointerEvents: 'all' }}
                  />
                )}

                {/* Connection line */}
                <line
                  x1={centerX}
                  y1={centerY}
                  x2={pos.x}
                  y2={pos.y}
                  stroke={type.color}
                  strokeWidth={isSelected || isHovered ? "3" : "1.5"}
                  opacity={isSelected || isHovered ? "0.6" : "0.3"}
                  className="transition-all duration-300"
                  style={{ pointerEvents: 'none' }}
                />

                {/* Node circle - bigger when selected */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isSelected || isHovered ? nodeRadiusActive : nodeRadius}
                  fill={type.color}
                  opacity="1"
                  className="transition-all duration-300"
                  style={{
                    pointerEvents: isMobile ? 'none' : 'all',
                    filter: isSelected ? 'drop-shadow(0 0 8px currentColor)' : 'none'
                  }}
                />

                {/* Icon */}
                <foreignObject
                  x={pos.x - 15}
                  y={pos.y - 15}
                  width="30"
                  height="30"
                  style={{ pointerEvents: 'none' }}
                >
                  <div className="flex items-center justify-center w-full h-full">
                    <Icon className="w-6 h-6 text-white" size={24} style={{ color: 'white' }} />
                  </div>
                </foreignObject>

                {/* Label - hide entirely on mobile */}
                {!isMobile && (
                  <>
                    <text
                      x={pos.x}
                      y={pos.y + labelDistance}
                      textAnchor="middle"
                      className="fill-amber-100 font-semibold"
                      style={{ fontSize: `${labelFontSize}px`, pointerEvents: 'none' }}
                    >
                      {type.name}
                    </text>
                    {type.subpoint && (
                      <text
                        x={pos.x}
                        y={pos.y + labelDistance + 15}
                        textAnchor="middle"
                        className="fill-slate-400"
                        style={{ fontSize: `${subpointFontSize}px`, pointerEvents: 'none' }}
                      >
                        {type.subpoint}
                      </text>
                    )}
                  </>
                )}
              </g>
            );
          })}

          {/* Central title with filled circle - rendered last to appear on top */}
          <circle
            cx={centerX}
            cy={centerY}
            r={centerCircleRadius}
            fill="rgba(30, 41, 59, 1)"
            stroke="rgba(71, 85, 105, 0.6)"
            strokeWidth="2"
            style={{ pointerEvents: 'none' }}
          />
          <text
            x={centerX}
            y={centerY - 10}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-amber-100 font-bold"
            style={{ fontSize: `${centerTitleSize}px`, pointerEvents: 'none' }}
          >
            Flavors of
          </text>
          <text
            x={centerX}
            y={centerY + 12}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-amber-100 font-bold"
            style={{ fontSize: `${centerTitleSize}px`, pointerEvents: 'none' }}
          >
            AI Harm
          </text>
        </svg>
      </div>

      {/* Details panel with slide-in animation */}
      {selectedType && (
        <div
          key={selectedType}
          className="bg-black/40 rounded-lg shadow-lg border border-slate-700"
          style={{
            padding: isSmallMobile ? '0.75rem' : isMobile ? '1rem' : '1.5rem',
            marginTop: isSmallMobile ? '1rem' : isMobile ? '1.5rem' : '2rem',
            animation: 'fadeIn 0.3s ease-in'
          }}
        >
          {/* Category heading with accent color */}
          <div className="flex items-center gap-3 mb-3" style={{
            paddingBottom: isSmallMobile ? '0.5rem' : '0.75rem',
            borderBottom: `3px solid ${types.find(t => t.id === selectedType)?.color}40`
          }}>
            {(() => {
              const selectedCategory = types.find(t => t.id === selectedType);
              if (!selectedCategory) return null;
              const Icon = selectedCategory.icon;
              return (
                <>
                  <div
                    className="p-2 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: `${selectedCategory.color}20` }}
                  >
                    <Icon
                      size={isSmallMobile ? 24 : isMobile ? 28 : 24}
                      style={{ color: selectedCategory.color }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3
                      className="font-bold"
                      style={{
                        fontSize: isSmallMobile ? '1.25rem' : isMobile ? '1.5rem' : '1.25rem',
                        color: selectedCategory.color
                      }}
                    >
                      {selectedCategory.name}
                    </h3>
                    {selectedCategory.subpoint && (
                      <p
                        className="text-slate-400"
                        style={{ fontSize: isSmallMobile ? '0.75rem' : '0.875rem' }}
                      >
                        {selectedCategory.subpoint}
                      </p>
                    )}
                  </div>
                </>
              );
            })()}
          </div>

          {/* Progress indicator */}
          <div className="flex justify-center gap-1.5 mb-4">
            {types.map(type => (
              <button
                key={type.id}
                onClick={() => handleUserSelection(type.id)}
                className="transition-all duration-200"
                style={{
                  width: selectedType === type.id ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  backgroundColor: selectedType === type.id ? type.color : `${type.color}40`,
                  border: 'none',
                  cursor: 'pointer'
                }}
                aria-label={`Select ${type.name}`}
              />
            ))}
          </div>

          {/* Content */}
          <div
            style={{
              display: 'grid',
              gap: isSmallMobile ? '0.75rem' : isMobile ? '1rem' : '1rem'
            }}
          >
            {(() => {
              const selectedCategory = types.find(t => t.id === selectedType);
              if (!selectedCategory) return null;

              return (
                <>
                  <div>
                    <h4
                      className="font-semibold text-amber-100 mb-1.5"
                      style={{ fontSize: isSmallMobile ? '0.875rem' : '1rem' }}
                    >
                      Mechanism
                    </h4>
                    <p
                      className="text-slate-300 leading-relaxed"
                      style={{ fontSize: isSmallMobile ? '0.8125rem' : '0.875rem' }}
                      dangerouslySetInnerHTML={{ __html: selectedCategory.mechanism }}
                    />
                  </div>

                  <div>
                    <h4
                      className="font-semibold text-amber-100 mb-1.5"
                      style={{ fontSize: isSmallMobile ? '0.875rem' : '1rem' }}
                    >
                      Who is affected
                    </h4>
                    <p
                      className="text-slate-300 leading-relaxed"
                      style={{ fontSize: isSmallMobile ? '0.8125rem' : '0.875rem' }}
                      dangerouslySetInnerHTML={{ __html: selectedCategory.who }}
                    />
                  </div>

                  <div>
                    <h4
                      className="font-semibold text-amber-100 mb-1.5"
                      style={{ fontSize: isSmallMobile ? '0.875rem' : '1rem' }}
                    >
                      Evidence
                    </h4>
                    <p
                      className="text-slate-300 leading-relaxed"
                      style={{ fontSize: isSmallMobile ? '0.8125rem' : '0.875rem' }}
                      dangerouslySetInnerHTML={{ __html: selectedCategory.evidence }}
                    />
                  </div>

                  <div>
                    <h4
                      className="font-semibold text-amber-100 mb-1.5"
                      style={{ fontSize: isSmallMobile ? '0.875rem' : '1rem' }}
                    >
                      Demands
                    </h4>
                    <p
                      className="text-slate-300 leading-relaxed"
                      style={{ fontSize: isSmallMobile ? '0.8125rem' : '0.875rem' }}
                      dangerouslySetInnerHTML={{ __html: selectedCategory.demand }}
                    />
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default AIHarmsInfographic;
