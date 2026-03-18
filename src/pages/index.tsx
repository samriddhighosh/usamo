import { useLocation } from '@gatsbyjs/reach-router';
import {
  AcademicCapIcon,
  ChartBarIcon,
  ChatAlt2Icon,
  ClipboardListIcon,
  CogIcon,
  DatabaseIcon,
  LightningBoltIcon,
  TerminalIcon,
  UserGroupIcon,
} from '@heroicons/react/outline';
import classNames from 'classnames';
import { Link, navigate } from 'gatsby';
import { StaticImage } from 'gatsby-plugin-image';
import * as React from 'react';
import { GlowingRing } from '../components/elements/landing/GlowingRing';
import { GlowingText } from '../components/elements/landing/GlowingText';
import { GradientText } from '../components/elements/landing/GradientText';
import { HighlightedText } from '../components/elements/landing/HighlightedText';
import ContributorsSection from '../components/Index/ContributorsSection';
import { CPIProjectCard } from '../components/Index/CPIProjectCard';
import { Feature } from '../components/Index/Feature';
import { ProblemsetsFeature } from '../components/Index/features/ProblemsetsFeature';
import { ProgressTrackingFeature } from '../components/Index/features/ProgressTrackingFeature';
import { ResourcesFeature } from '../components/Index/features/ResourcesFeature';
import {
  EasyFunCoding,
  NonTrivial,
  XCamp,
} from '../components/Index/sponsor-logos';
import TrustedBy from '../components/Index/TrustedBy';
import Layout from '../components/layout';
import SEO from '../components/seo';
import TopNavigationBar from '../components/TopNavigationBar/TopNavigationBar';
import {
  useCurrentUser,
  useIsUserDataLoaded,
} from '../context/UserDataContext/UserDataContext';
import ActiveCardsHome from '../components/activeCardsHome';

const containerClasses = 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8';
const headerClasses =
  'text-4xl md:text-5xl 2xl:text-6xl font-black text-black dark:text-white';
const headerClassesNoText = 'text-4xl md:text-5xl 2xl:text-6xl font-black';
const subtextClasses =
  'text-lg md:text-xl 2xl:text-2xl font-medium max-w-4xl leading-relaxed text-gray-700 dark:text-gray-400';
const headerSubtextSpacerClasses = 'h-6 2xl:h-12';
const whiteButtonClassesBig =
  'text-lg bg-white px-4 py-2 md:px-6 md:py-3 rounded-[130px] font-medium text-gray-900 relative';
const whiteButtonClasses =
  'text-lg md:text-xl bg-white px-4 py-2 md:px-6 md:py-3 rounded-lg font-medium text-gray-900 relative';
const usamoTitleClasses =
  'md:text-center font-extrabold tracking-tight text-5xl sm:text-6xl md:text-7xl 2xl:text-8xl bg-clip-text text-transparent bg-linear-to-b from-gray-900 to-gray-600 dark:from-white dark:to-red-200';
const linkTextStyles =
  'text-blue-600 dark:text-blue-300 transition hover:text-purple-600 dark:hover:text-purple-300';

export default function IndexPage({ path }): JSX.Element {
  const currentUser = useCurrentUser();
  const loading = useIsUserDataLoaded();
  const location = useLocation();
  React.useEffect(() => {
    // User will normally be redirected to the dashboard if the user is logged in, but if user clicks the icon in the top left corner while on the dashboard, they will not be redirected.
    try {
      if (currentUser && location.state.redirect) {
        /* Whether or not the user should be redirected to the dashboard is stored in location.state.redirect, but if the user opens a link straight
        to the landing page, location.state.redirect will be undefined, causing a typeerror, this try catch statements accounts for that */
        navigate('/dashboard');
      }
    } catch (e) {
      if (currentUser) {
        navigate('/dashboard');
      }
    }
  }, [currentUser, loading, location]);

  return (
    <Layout>
      <SEO title={null} image={null} pathname={path} />

      <div className="fixed top-0 z-50 w-full">
        <div className="backdrop-blur-lg bg-white/70 dark:bg-black/20 border-b border-white/10 dark:border-gray-800">
          <TopNavigationBar />
        </div>
      </div>

      {/* Begin Hero */}
     <div className="relative overflow-hidden -mt-16 pt-48 bg-gray-50 dark:bg-gradient-to-b dark:from-black dark:via-black dark:to-[#1a0d00] transition-colors duration-500">

      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 z-0 [mask-image:radial-gradient(ellipse_at_center,white_20%,transparent_75%)]">
          <svg className="h-full w-full opacity-[0.15] dark:opacity-[0.4]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-pattern" width="50" height="50" patternUnits="userSpaceOnUse">
                {/* We use a brighter orange-400 and a 1px stroke for visibility */}
                <path 
                  d="M 50 0 L 0 0 0 50" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1" 
                  className="text-orange-400/60 dark:text-orange-500/80" 
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </svg>
        </div>
      {/* <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-orange-500/10 blur-[120px] rounded-full" />
      */}
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(251,146,60,0.08)_0%,transparent_70%)] pointer-events-none" />

      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-purple-500/10 blur-[100px] rounded-full" />
      
      <div className="absolute inset-x-0 bottom-0 h-64 bg-linear-to-t from-[#160f08] to-transparent" />

      <div className="relative z-10 flex flex-col px-4 sm:px-6 md:min-h-[70vh] lg:px-8">
          <div className="h-6 sm:h-12"></div>

          <div className="flex flex-1 flex-col justify-center">
            <div className="h-24"></div>

            <div className="flex md:justify-center dark:hidden">
              <div className={classNames(usamoTitleClasses, 'mt-4 text-black')}>
                The Only Online Guide for Math Competition
              </div>
            </div>
            {/* <div className={classNames(usamoTitleClasses, "flex flex-row gap-1 h-0 dark:visible dark:h-auto")}>
              The 
              <GlowingText
                className={'text-orange-400'}
              >
                Only Online Guide
              </GlowingText>
               for Math Competitions
            </div> */}
            <div>
              <h1 className={classNames(usamoTitleClasses, "flex flex-row leading-20 mx-auto font-semibold h-0 dark:visible dark:h-auto w-8/12 justify-center items-center")}>
              The Only Guide You Need for Competitive Math</h1>
            </div>

            <div className="h-6 sm:h-8"></div>

            <p className="font-brand text-8 leading-snug text-gray-800 sm:text-xl md:text-center md:!leading-normal 2xl:text-3xl dark:text-gray-300">
              A simple, easy to follow pathway for your success
            </p>

            <div className="h-10 sm:h-14"></div>

            <div className="flex gap-10 md:justify-center">
              
              <Link
                  to="/dashboard"
                  className="transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(251,146,60,0.4)] border-orange-600 bg-linear-to-br from-orange-300 to-orange-400 text-[16px] inline-block px-8 py-3 rounded-full font-bold text-white relative"
                >
                  Resources >
                </Link>
                <GlowingRing>
                <Link
                  to="/dashboard"
                  className={classNames(whiteButtonClassesBig, '!text-[15px] inline-block !font-bold')}
                >
                  Get Started
                </Link>
              </GlowingRing>
            </div>
          </div>

          <div className="h-16 sm:h-24"></div>

          <div className="flex text-gray-600 md:justify-center md:text-xl dark:text-gray-400">
            <a
              href="https://joincpi.org/"
              className="inline-flex items-center space-x-3 md:space-x-4"
            >
              {/* <div className="h-9 w-9">
                <svg
                  className="inline-block"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 100 100"
                >
                  <g>
                    <path
                      className="fill-current text-[#6600af]"
                      d="M50,5A45,45,0,1,1,5,50,45.05,45.05,0,0,1,50,5m0-5a50,50,0,1,0,50,50A50,50,0,0,0,50,0Z"
                    ></path>
                  </g>
                  <line
                    className="stroke-current stroke-[7px] text-[#be5eff]"
                    style={{ strokeMiterlimit: 10 }}
                    x1="50"
                    y1="27"
                    x2="73.29"
                    y2="65.64"
                  ></line>
                  <line
                    className="stroke-current stroke-[7px] text-[#be5eff]"
                    style={{ strokeMiterlimit: 10 }}
                    x1="50"
                    y1="27"
                    x2="26.71"
                    y2="67"
                  ></line>
                  <circle
                    className="fill-current text-[#961be8]"
                    cx="50"
                    cy="27"
                    r="10"
                  ></circle>
                  <circle
                    className="fill-current text-[#961be8]"
                    cx="26.71"
                    cy="67"
                    r="10"
                  ></circle>
                  <circle
                    className="fill-current text-[#961be8]"
                    cx="73.29"
                    cy="67"
                    r="10"
                  ></circle>
                </svg>
              </div> */}

              {/* <span>Built by the USAMO Guide community</span> */}
            </a>
          </div>
          <div className="h-4 sm:h-6 md:h-16"></div>
        </div>
      </div>
      {/* End Hero */}

      {/* Learn Contest Math. Efficiently. */}
     <div className="dark:bg-gradient-to-b dark:from-[#e85d04]/10 dark:via-[#e85d04]/20 dark:to-[#e85d04]/30 transition-colors duration-500">
      <div className="h-12 sm:h-20 md:h-36 2xl:h-48"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-orange-900/20 blur-[150px] rounded-full pointer-events-none" />

      <div className={containerClasses}>
        {/* Typography with a warm glow */}
        <h2 className='justify-center items-center mx-auto flex flex-col text-6xl font-bold pb-3 dark:text-orange-50/90'>
          Learn Contest Math
        </h2>
            <p className={classNames(subtextClasses, "text-center mx-auto !w-2/4")}>
              Carefully designed for math contest students –
              available to everyone, for free.
            </p>

          <div className="h-12 md:h-20 2xl:h-36"></div>
          <div className='flex lg:flex-row gap-2'>
                <Feature
                  icon={DatabaseIcon}
                  iconClasses="from-cyan-400 to-sky-500"
                  title="Curated Resources"
                  blobClasses="bg-sky-200 dark:bg-sky-800 hidden xl:block"
                  feature={<ResourcesFeature />}
                >
                  Learn new topics from a vetted list of high-quality resources. If
                  one resource doesn't click, look at another!
                </Feature>

                <div className="h-12 md:h-20 2xl:h-36"></div>

                <Feature
                  icon={ClipboardListIcon}
                  iconClasses="from-purple-400 to-indigo-500"
                  title="Extensive Problemsets"
                  blobClasses="bg-purple-300 dark:bg-purple-800"
                  feature={<ProblemsetsFeature />}
                >
                  Practice each topic with extensive problemsets and solutions
                  covering a wide range of difficulties.
                </Feature>
          </div>


          <div className="h-6 md:h-10 2xl:h-24"></div>
          <div className='grid grid-cols-5 gap-4'>
             <Feature
            icon={LightningBoltIcon}
            iconClasses="from-yellow-400 to-orange-500"
            title="Progress Tracking"
            blobClasses="bg-orange-200 dark:bg-orange-800"
            feature={<ProgressTrackingFeature />}
            fade="none"
            classes='col-start-1 col-end-4'
          >
            Use our progress-tracking tools to track your progress in the Guide
            and stay motivated.
          </Feature>

            <Feature
              icon={ChatAlt2Icon}
              iconClasses="from-green-400 to-cyan-500"
              title="Help when you need it"
              blobClasses="bg-green-200 dark:bg-green-800"
              classes='col-span-5 md:col-start-4 md:col-end-6'
              feature={
                <div className="rounded-lg shadow-lg">
                  <StaticImage
                    src="../assets/nontrivial.png"
                    alt="AoPS Community Screenshot"
                    placeholder="blurred"
                    layout="constrained"
                    width={560}
                  />
                </div>
              }
              fade="none"
            >
              <span className="mb-4 block md:mb-8">
                Ask questions, share solutions, and learn from other contest
                students in the AoPS community.
              </span>

              <a
                href="https://artofproblemsolving.com/community"
                target="_blank"
                rel="noreferrer"
                className={linkTextStyles}
              >
                Visit AoPS Community &rarr;
              </a>
            </Feature>
          </div>
          

          
        </div>
        <div className="h-16 md:h-20 2xl:h-36"></div>
      </div>
      {/* End Learn contest math. */}

     <div className="relative text-center overflow-hidden bg-gradient-to-b from-[#e85d04]/30 via-[#3d1a04] to-[#e85d04]/40 transition-colors duration-500">
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-orange-400/20 to-transparent"/>
        <div className="h-16 md:h-20 2xl:h-36"></div>

        <div className={classNames(
        containerClasses, 
        'relative mx-auto w-11/12 md:w-3/4 rounded-4xl py-20 px-8 transition-all duration-500 overflow-hidden',
        'bg-linear-to-br from-white/95 via-[#f4dcbf] to-[#fb923c] backdrop-blur-md', 
        'shadow-[0_20px_60px_-15px_rgba(249,115,22,0.3)] border border-white/60'
      )}>
      
      <div className="absolute inset-0 opacity-[0.15] [mask-image:radial-gradient(ellipse_at_center,white,transparent)] pointer-events-none">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" className="text-orange-900" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

    <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-orange-400/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="absolute top-0 left-0 right-0 h-20 bg-linear-to-b from-white/40 to-transparent rounded-t-4xl pointer-events-none" />
      <div className="relative z-10">
            <div className="dark:hidden">
              <h1 className={classNames(headerClasses, "text-orange-900")}>Strealine your Learning</h1>
            </div>
            <div className="invisible h-0 dark:visible dark:h-auto">
              <h2
                className={classNames(headerClassesNoText, 'text-orange-900 !font-bold')}
              >
                Streamline your Learning
              </h2>
            </div>

          <div className="h-4 2xl:h-12"></div>

          <p className={classNames(subtextClasses, 'text-center mx-auto w-11/12 md:w-3/4 !text-[#62210b] font-medium')}>
            This guide is written by{' '}
            <span className="text-[#9a3412]">top math contest performers</span> and
            educators who care about clean, rigorous solutions.
          </p>
          <div className="h-16 2xl:h-12"></div>

          <div className="brightness-50 contrast-125 opacity-70">
            <TrustedBy />
          </div>

          <div className="h-8 md:h-12 2xl:h-16"></div>

          <div className="group relative inline-block">
            <div className="absolute -inset-1 bg-orange-600/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <Link
              to="/dashboard"
              className="relative inline-flex items-center px-12 py-4 bg-[#2a0e06] text-orange-50 rounded-full font-bold hover:scale-105 hover:bg-black transition-all shadow-2xl active:scale-95"
            >
              View Guide
              <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
        </div>
        <div className="h-16 md:h-20 2xl:h-36"></div>
      </div>
      <ActiveCardsHome/>

      <div className="bg-gray-100 dark:bg-black">
        <div className="h-16 md:h-20 xl:h-36 2xl:h-48"></div>

        <div className={containerClasses}>
          <div className="dark:hidden">
            <h1 className={classNames(headerClasses)}>Join our Team.</h1>
          </div>
          <div className="invisible h-0 dark:visible dark:h-auto">
            <GlowingText
              className={classNames(headerClassesNoText, 'text-white')}
              extraGlow
            >
              Join our Team.
            </GlowingText>
          </div>

          <div className={headerSubtextSpacerClasses}></div>
          <p className={subtextClasses}>
            USAMO Guide is a student-run community dedicated to olympiad
            mathematics. Join us to write lessons, curate problem sets, and
            grow as a mentor alongside fellow contest enthusiasts.
          </p>
          <div className="h-8 md:h-12"></div>

          <div className="group relative inline-block">
            <GlowingRing>
              <a
                href="https://docs.google.com/document/d/13QpXqdiYQwjBLnywGL1FUG7GFdh8SM_1NigIkJl-A7k/edit?usp=sharing"
                target="_blank"
                rel="noreferrer"
                className={classNames(whiteButtonClasses, 'inline-block')}
              >
                Apply Now
              </a>
            </GlowingRing>
          </div>

          <hr className="my-16 border-gray-300 md:my-20 2xl:my-24 dark:border-gray-800" />

          <div className="dark:hidden">
            <h1 className={classNames(headerClasses)}>
              Or, help us financially!
            </h1>
          </div>
          <div className="invisible h-0 dark:visible dark:h-auto">
            <GlowingText
              className={classNames(headerClassesNoText, 'text-white')}
              extraGlow
            >
              Or, help us financially!
            </GlowingText>
          </div>

          <div className={headerSubtextSpacerClasses}></div>
          <p className={subtextClasses}>
            We're a <GradientText>501(c)3 nonprofit organization</GradientText>{' '}
            — all donations are tax deductible. Since our inception in September
            2020, we've impacted tens of thousands of students across our
            various initiatives.
          </p>
          <div className="h-8 md:h-12"></div>

          <div className="flex items-center">
            <GlowingRing>
              <a
                href="mailto:sponsorship@joincpi.org"
                target="_blank"
                rel="noreferrer"
                className={classNames(whiteButtonClasses, 'inline-block')}
              >
                Sponsor Us
              </a>
            </GlowingRing>
            <span className="ml-4 text-lg font-medium text-gray-400 md:ml-6">
              or{' '}
              <a
                href="https://www.paypal.com/donate?hosted_button_id=FKG88TSTN82E4"
                target="_blank"
                rel="noreferrer"
                className={linkTextStyles}
              >
                Donate via PayPal
              </a>
            </span>
            <br />
          </div>
          <div className="mt-4 text-base leading-6 text-gray-500 dark:text-gray-400">
            Read our
            <a
              href="https://joincpi.org/sponsorship_prospectus.pdf"
              target="_blank"
              rel="noreferrer"
              className={linkTextStyles}
            >
              {' '}
              sponsorship prospectus
            </a>
          </div>

          <div className="h-12 md:h-20"></div>

          <p className="text-lg font-medium text-gray-700 uppercase md:text-xl dark:text-gray-400">
            Our Sponsors
          </p>
          {/* Sponsor logos don't fit well in the light theme */}
          <p className="pt-6 font-semibold text-gray-600 uppercase md:text-lg dark:text-gray-400">
            Platinum Sponsors
          </p>
          <div className="my-8 grid grid-cols-1 items-center gap-4 space-y-5 text-gray-600 sm:grid-cols-2 sm:space-y-0 md:grid-cols-3 lg:my-6 lg:grid-cols-4 dark:text-gray-400">
            <div className="col-span-1">
              <a
                href="http://non-trivial.org/"
                target="_blank"
                rel="noreferrer"
              >
                <NonTrivial />
              </a>
            </div>
            <div className="col-span-1 pt-5 sm:pt-0">
              <a href="http://x-camp.academy/" target="_blank" rel="noreferrer">
                <XCamp />
              </a>
            </div>
          </div>
          <p className="pt-6 font-semibold text-gray-600 uppercase md:text-lg dark:text-gray-400">
            Bronze Sponsors
          </p>
          <div className="my-8 grid grid-cols-2 items-center gap-0.5 text-gray-400 md:grid-cols-3 lg:my-6 lg:grid-cols-4">
            <div className="col-span-1">
              <a
                href="https://easyfuncoding.com"
                target="_blank"
                rel="noreferrer"
              >
                <EasyFunCoding />
              </a>
            </div>
          </div>
        </div>

        <div className="h-16 md:h-20 xl:h-36 2xl:h-48"></div>
      </div>

      {/* Begin FAQ */}
      <div className="dark:bg-dark-surface bg-white">
        <div className="mx-auto max-w-(--breakpoint-xl) px-4 pt-12 pb-16 sm:px-6 sm:pt-16 sm:pb-20 lg:px-8 lg:pt-20 lg:pb-28">
          <h2 className={classNames(headerClasses, 'dark:text-gray-100')}>
            Frequently asked questions
          </h2>
          <div className="pt-10 md:pt-16">
            <dl className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <div>
                  <dt className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                    What are AMC, AIME, and USAMO?
                  </dt>
                  <dd className="mt-2">
                    <p className="text-base leading-6 text-gray-500 dark:text-gray-400">
                      The AMC (8/10/12) and AIME are the main pipeline contests
                      in the U.S. that culminate in USAMO. For official contest
                      information and schedules, see the{' '}
                      <a
                        href="https://www.maa.org/math-competitions"
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline dark:text-blue-400"
                      >
                        MAA competitions page
                      </a>
                      .
                    </p>
                  </dd>
                </div>
                <div className="mt-12">
                  <dt className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                    Is this an official syllabus?
                  </dt>
                  <dd className="mt-2">
                    <p className="text-base leading-6 text-gray-500 dark:text-gray-400">
                      No. This guide is a community-curated roadmap that
                      reflects common contest topics and problem-solving
                      techniques. It does not represent an official syllabus.
                    </p>
                  </dd>
                </div>
                <div className="mt-12">
                  <dt className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                    How do I report a problem or ask a question?
                  </dt>
                  <dd className="mt-2">
                    <p className="text-base leading-6 text-gray-500 dark:text-gray-400">
                      If you encounter an issue while using the guide (website
                      bug, typo, broken link, unclear explanation, etc), use the
                      "Contact Us" button. Alternatively, email us at{' '}
                      <a
                        href="mailto:usamoguide@gmail.com"
                        className="text-blue-600 underline dark:text-blue-400"
                      >
                        usamoguide@gmail.com
                      </a>
                      .
                    </p>
                  </dd>
                </div>
                <div className="mt-12">
                  <dt className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                    I'm looking for classes, club curriculum...
                  </dt>
                  <dd className="mt-2">
                    <p className="text-base leading-6 text-gray-500 dark:text-gray-400">
                      Check out AoPS classes and community-led study groups, or
                      join the USAMO Guide study cohorts.
                    </p>
                  </dd>
                </div>
              </div>
              <div className="mt-12 md:mt-0">
                <div>
                  <dt className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                    Is this guide only for USAMO qualifiers?
                  </dt>
                  <dd className="mt-2">
                    <p className="text-base leading-6 text-gray-500 dark:text-gray-400">
                      Not at all. The guide is designed to support AMC 8, AMC
                      10/12, AIME, and USAMO learners at every level.
                    </p>
                  </dd>
                </div>
                <div className="mt-12">
                  <dt className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                    How can I get help?
                  </dt>
                  <dd className="mt-2">
                    <p className="text-base leading-6 text-gray-500 dark:text-gray-400">
                      If you get stuck, ask questions in the{' '}
                      <a
                        href="https://artofproblemsolving.com/community"
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline dark:text-blue-400"
                      >
                        AoPS community
                      </a>{' '}
                      or reach out via the Contact Us button.
                    </p>
                  </dd>
                </div>
                <div className="mt-12">
                  <dt className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                    How can I contribute?
                  </dt>
                  <dd className="mt-2">
                    <p className="text-base leading-6 text-gray-500 dark:text-gray-400">
                      Contributions are welcome! Visit our{' '}
                      <a
                        href="https://github.com/cpinitiative/usamo-guide"
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline dark:text-blue-400"
                      >
                        GitHub repository
                      </a>
                      to find guidelines and open issues.
                    </p>
                  </dd>
                </div>
                <div className="mt-12">
                  <dt className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                    Is this open source?
                  </dt>
                  <dd className="mt-2">
                    <p className="text-base leading-6 text-gray-500 dark:text-gray-400">
                      Yes! Check out our{' '}
                      <a
                        href="https://github.com/cpinitiative/usamo-guide"
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline dark:text-blue-400"
                      >
                        GitHub Repository
                      </a>
                      .
                    </p>
                  </dd>
                </div>
              </div>
            </dl>
          </div>
        </div>
      </div>
      {/*End FAQ*/}

      <ContributorsSection />

      <div className="bg-gray-100 dark:bg-gray-900">
        <div className="mx-auto max-w-(--breakpoint-xl) px-4 py-12">
          <p className="dark:text-dark-med-emphasis text-center text-base leading-6 text-gray-400">
            &copy; {new Date().getFullYear()} USAMO Guide.
            <br />
            No part of this website may be reproduced or commercialized in any
            manner without prior written permission.{' '}
            <Link to="/license" className="underline">
              Learn More.
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}
