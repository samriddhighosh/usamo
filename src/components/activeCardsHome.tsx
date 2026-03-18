import { AcademicCapIcon, ChartBarIcon, ChevronRightIcon, ClockIcon, CogIcon, TerminalIcon, UserGroupIcon } from '@heroicons/react/solid';
import classNames from 'classnames';
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarCheck } from 'lucide-react';
import ContestWidget from './ContextWdiget';

const headerClasses =
  'text-4xl md:text-5xl 2xl:text-6xl font-black text-black dark:text-white';
const subtextClasses =
  'text-lg md:text-xl 2xl:text-2xl font-medium max-w-4xl leading-relaxed text-gray-700 dark:text-gray-400';

const projects = [
  {
    title: "Weekly Problem Sessions",
    icon: CalendarCheck,
    color: "from-fuchsia-500 to-purple-600",
    desc: "Join guided sessions focused on problem solving, solution writing, and proof critique. Led by top performers to help you master competition-level rigor.",
    url: "/groups",
    widget: <ContestWidget/>
  },
  {
    title: "AoPS Wiki Archive",
    icon: TerminalIcon,
    color: "from-orange-400 to-pink-600",
    desc: "A centralized repository of official statements and solutions for AMC, AIME, and USAMO. The ultimate quick-reference tool for historical contest data.",
    url: "https://artofproblemsolving.com/wiki/index.php/Main_Page"
  },
  {
    title: "Study Groups",
    icon: UserGroupIcon, // Swapped to UserGroup for better context
    color: "from-green-400 to-cyan-500",
    desc: "A custom-built learning management system designed specifically for math clubs, classes, and competitive teams to track progress together.",
    url: "/groups"
  },
  {
    title: "Mock Contests",
    icon: ClockIcon, // Changed to Clock to represent "Timed"
    color: "from-purple-500 to-indigo-500",
    desc: "Build endurance with timed sets modeled exactly after the AMC, AIME, and USAMO environments. Perfect for overcoming competition-day nerves.",
    url: "/groups"
  },
  {
    title: "Proofwriting Clinics",
    icon: ChartBarIcon,
    color: "from-cyan-400 to-sky-500",
    desc: "Intensive short-form workshops that emphasize mathematical rigor, logical structure, and stylistic clarity in high-level proof writing.",
    url: "/groups"
  },
  {
    title: "Mentorship",
    icon: CogIcon,
    color: "from-yellow-400 to-orange-500",
    desc: "Get paired with experienced mentors for direct feedback on your solutions, personalized study plans, and guidance through the contest circuit.",
    url: "/groups"
  }
];

const ActiveCardsHome = () => {
    const [activeCard, setActiveCard] = useState(0);

  return (
    <div className="bg-gray-950 dark:bg-linear-to-b dark:from-[#e85d04]/40 dark:via-[#9a4209] dark:to-[#fb923c]/40 transition-colors duration-500">
          <div className="h-16 md:h-20 2xl:h-36"></div>
            <div className="px-4 sm:px-6 lg:px-8 2xl:px-16">
              <h2 className={classNames(headerClasses, 'md:text-center')}>
                Built by the USAMO Guide community.
              </h2>
              <div className="h-2 md:h-8"></div>
              <p className={classNames(subtextClasses, 'mx-auto md:text-center')}>
                Here are a few resources and study tools that pair well with the
                guide.
              </p>

              <div className="2xl:24 h-12 md:h-16"></div>

            <div className='flex gap-4 items-start'>
              <div className="flex flex-col w-full md:w-2/6 flex-shrink-0">
                {projects.map((project,id)=> (
                    <div key={id} onClick={()=> setActiveCard(id)} className={classNames('group cursor-pointer border transition-all duration-300 p-1',
                        "border-x border-t border-white/10",
                        id===0? "rounded-t-2xl":"",
                        id===projects.length-1 ? "border-b rounded-b-2xl": "boder-b-0",
                        activeCard ===id 
                        ? "bg-white/10 border-orange-400/50 shadow-[0_0_20px_rgba(251,146,60,0.1)]" 
                        : "bg-transparent border-white/5 hover:border-white/[0.03]"
                    )}>
                        {activeCard===id && (
                            <div className='absolute left-0 top-2 botton-2 w-1 bg-orange-500 rounded-full'/>
                        )}
                        <div className='p-4 flex items-center justify-between'>
                            <div className='flex items-center gap-4'>
                                <div className={classNames("p-2 rounded-lg", project.color)}>
                                    <project.icon className='size-6'/>
                                </div>
                                <span className='font-bold text-white text-lg'>{project.title}</span>
                            </div>
                            <ChevronRightIcon
                                className={classNames('w-5 h-5 text-white/30 transition-transform duration-300',
                                    activeCard===id?"rotate-90 text-orange-400": ''
                                )}
                            />
                        </div>
                        <AnimatePresence>
                            {activeCard === id && (
                                <motion.div
                                    initial={{height:0, opacity:0}}
                                    animate={{height:'auto', opacity:1}}
                                    exit={{height:0, opacity:0}}
                                    className="overflow-hidden"
                                >
                                    <p className='px-6 pb-6 text-orange-100/60 text-sm leading-relaxed line-clamp-3'>
                                        {project.desc}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </div>
                ))}
              </div>
              <div className="hidden md:block relative flex-grow">

                <div className="sticky top-24 h-fit min-h-[600px]">
                <div className={classNames(
                    "absolute left-0 top-0 w-[100vw] h-full", 
                    "overflow-hidden rounded-3xl border border-gray-200 bg-white/50 p-12 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5 md:p-10"
                )}>
                    
                    <div className="max-w-2xl relative z-10">
                    <div className={classNames("inline-block rounded-xl my-4 shadow-2xl from-orange-300 to-orange-700")}>
                            {React.createElement(projects[activeCard].icon, { className: "w-8 h-8 text-white" })}
                        
                    </div>
                    
                    <h3 className="text-4xl font-extrabold text-white tracking-tighter leading-none">
                        {projects[activeCard].title}
                    </h3>
                    
                    <div className="h-1 w-20 bg-orange-500/30 my-4 rounded-full" />
                    
                    <p className="text-xl text-orange-50/70 font-medium w-full">
                        {projects[activeCard].desc}
                    </p>

                    <div className="flex-grow flex items-center justify-center py-10">
                        <div className="w-full">
                        {projects[activeCard].widget}
                        </div>
                    </div>

                    </div>

                    {/* Deep Ambient Glow in the bottom right of the panel */}
                    <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-orange-600/10 blur-[100px] rounded-full pointer-events-none" />
                </div>
                </div>
              </div>
            </div>

        </div>
        <div className="h-16 md:h-36"></div>
    </div>
  )
}

export default ActiveCardsHome