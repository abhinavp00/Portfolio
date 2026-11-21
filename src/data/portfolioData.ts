import leadPredictionImg from '../assets/images/project_lead_prediction_1794744195057.jpg';
import assetSphereImg from '../assets/images/project_assetsphere_dashboard_1794744195482.jpg';
import rentACarImg from '../assets/images/project_rentacar_platform_1794744195601.jpg';

export interface ContactConfig {
  email: string;
  phone: string;
  phoneHref: string;
  linkedinUrl: string;
  githubUrl: string;
  location: string;
  resumePath: string;
  formEndpoint: string | null;
}

export const CONTACT_CONFIG: ContactConfig = {
  email: 'abhinavp06082004@gmail.com',
  phone: '+91 7994826817',
  phoneHref: 'tel:+917994826817',
  linkedinUrl: 'https://www.linkedin.com/in/abhinav-python-dev',
  githubUrl: 'https://github.com/abhinavp00',
  location: 'Kerala, India',
  resumePath: '/Abhinav_P_Resume.pdf',
  formEndpoint: null,
};

export interface NavItem {
  id: string;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'services', label: 'Services' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'education', label: 'Education' },
  { id: 'contact', label: 'Contact' },
];

export const HERO_DATA = {
  availabilityLabel: 'Available for Opportunities · Kerala, India',
  greeting: "Hello, I'm",
  name: 'Abhinav P',
  title: 'Data Analytics & Python Full Stack Developer',
  description:
    'I build intelligent, data-driven applications and scalable backend systems by combining Python engineering, data analytics, modern web technologies, and AI-powered development.',
  highlights: [
    'Python Development',
    'Data Analytics',
    'Backend Engineering',
    'AI & Automation',
  ],
  portraitUrl: '/assets/aistudio/main_pro_00396858.png',
  portraitAlt: 'Abhinav P — Data Analytics and Python Full Stack Developer',
  focusAreas: [
    'Backend Engineering',
    'Data Analytics',
    'Full Stack Development',
  ],
};

export const ABOUT_DATA = {
  sectionLabel: '01 · About Me',
  heading: 'Turning Data Into Insights. Turning Ideas Into Applications.',
  paragraphs: [
    'I am a Data Analytics and Backend Developer with hands-on experience in building data-driven systems, analytics dashboards, and optimizing Django REST APIs for asset management and e-commerce platforms.',
    'I specialize in Python, Django REST Framework, SQL, database optimization, and React-based full-stack development. I have achieved approximately 25% reduction in P95 API latency through N+1 query elimination, composite indexing, and database schema optimization.',
    'My analytical skill set includes data cleaning, exploratory data analysis, data visualization, KPI analysis, and dashboard development using Power BI, Excel, Pandas, NumPy, and SQL.',
    'I also explore AI-assisted software development using Claude and other AI-powered agents, working with Generative AI, Large Language Models, prompt engineering, and agentic workflows to accelerate application development and intelligent business solutions.',
  ],
  highlights: [
    {
      index: '01',
      title: '25% API Latency Reduction',
      detail: 'P95 latency improvement via N+1 query elimination and composite indexing',
    },
    {
      index: '02',
      title: '40% Faster Report Generation',
      detail: 'Accelerated reporting workflows through SQL indexing and query tuning',
    },
    {
      index: '03',
      title: 'Python Full Stack Development',
      detail: 'End-to-end Django REST APIs paired with modern React.js interfaces',
    },
    {
      index: '04',
      title: 'Data Analytics & Visualization',
      detail: 'EDA, KPI modeling, and dashboards with Power BI, Tableau, Pandas & SQL',
    },
    {
      index: '05',
      title: 'AI-Assisted Application Development',
      detail: 'Building intelligent workflows with LLMs, Claude, and agentic tools',
    },
    {
      index: '06',
      title: 'Backend & Database Optimization',
      detail: 'Normalized schemas, JWT authentication, RBAC, and response caching',
    },
  ],
  personalInfo: [
    { label: 'Name', value: 'Abhinav P' },
    { label: 'Location', value: 'Kerala, India' },
    { label: 'Education', value: 'Bachelor of Computer Applications' },
    {
      label: 'Professional Interests',
      value: 'Data Analytics, Backend Engineering, AI Development',
    },
  ],
};

export interface SkillCategory {
  id: string;
  title: string;
  description: string;
  skills: string[];
}

export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    id: 'analytics',
    title: 'Programming & Analytics',
    description:
      'Statistical analysis, data preprocessing, exploratory investigation, and predictive modeling.',
    skills: [
      'Python',
      'SQL',
      'Pandas',
      'NumPy',
      'Matplotlib',
      'Seaborn',
      'Scikit-learn',
      'Machine Learning',
      'Data Analytics',
      'Exploratory Data Analysis',
    ],
  },
  {
    id: 'backend',
    title: 'Backend Development',
    description:
      'Scalable RESTful service architecture, authentication, role access control, and performance tuning.',
    skills: [
      'Django',
      'Django REST Framework',
      'REST API Development',
      'JWT Authentication',
      'Role-Based Access Control',
      'API Optimization',
      'Database Architecture',
      'Server-Side Validation',
    ],
  },
  {
    id: 'frontend',
    title: 'Frontend Development',
    description:
      'Responsive component-driven web interfaces integrated cleanly with backend APIs.',
    skills: [
      'React.js',
      'JavaScript',
      'HTML5',
      'CSS3',
      'Bootstrap',
      'Responsive UI Development',
    ],
  },
  {
    id: 'visualization',
    title: 'Data Visualization',
    description:
      'Executive KPI dashboards, interactive reporting suites, and business intelligence storytelling.',
    skills: [
      'Microsoft Power BI',
      'Tableau',
      'Microsoft Excel',
      'KPI Dashboards',
      'Business Intelligence',
      'Data Visualization',
    ],
  },
  {
    id: 'ai',
    title: 'AI & Agentic Development',
    description:
      'Applying LLMs, prompt engineering, and automated agent workflows to accelerate delivery.',
    skills: [
      'Claude',
      'Cursor',
      'Google AI Studio',
      'n8n',
      'Generative AI',
      'Large Language Models',
      'Prompt Engineering',
      'Agentic Workflows',
      'NLP',
    ],
  },
  {
    id: 'databases',
    title: 'Databases',
    description:
      'Relational schema design, migration discipline, composite indexing, and query optimization.',
    skills: [
      'PostgreSQL',
      'MySQL',
      'Supabase',
      'Database Schema Design',
      'Database Migrations',
      'Query Optimization',
      'Composite Indexing',
      'N+1 Query Optimization',
    ],
  },
  {
    id: 'tools',
    title: 'Cloud & Development Tools',
    description:
      'Containerized environments, version control workflows, and API testing and documentation.',
    skills: ['Docker', 'Git', 'GitHub', 'Postman', 'Swagger'],
  },
];

export interface ServiceItem {
  number: string;
  title: string;
  description: string;
  technologies: string[];
  iconName: 'barChart' | 'server' | 'layers' | 'database' | 'sparkles' | 'cpu';
}

export const SERVICES_DATA: ServiceItem[] = [
  {
    number: '01',
    title: 'Data Analytics & Business Intelligence',
    description:
      'Transform raw datasets into meaningful insights through data cleaning, EDA, statistical analysis, KPI tracking, and interactive dashboards.',
    technologies: ['Python', 'Pandas', 'NumPy', 'SQL', 'Power BI', 'Excel'],
    iconName: 'barChart',
  },
  {
    number: '02',
    title: 'Python Backend Development',
    description:
      'Develop scalable backend applications and secure REST APIs using Python and Django REST Framework.',
    technologies: ['Python', 'Django', 'DRF', 'JWT', 'PostgreSQL'],
    iconName: 'server',
  },
  {
    number: '03',
    title: 'Full Stack Web Development',
    description:
      'Build responsive, end-to-end web applications integrating modern React frontends with robust backend architectures.',
    technologies: ['React.js', 'JavaScript', 'Django', 'REST APIs'],
    iconName: 'layers',
  },
  {
    number: '04',
    title: 'Database Design & Optimization',
    description:
      'Design relational database structures, improve query performance, optimize indexing, and maintain data integrity.',
    technologies: ['PostgreSQL', 'MySQL', 'SQL'],
    iconName: 'database',
  },
  {
    number: '05',
    title: 'AI & Intelligent Application Development',
    description:
      'Explore and develop AI-powered applications using LLMs, prompt engineering, Claude, AI agents, and workflow automation.',
    technologies: ['Claude', 'Google AI Studio', 'n8n', 'Generative AI'],
    iconName: 'sparkles',
  },
  {
    number: '06',
    title: 'Machine Learning Solutions',
    description:
      'Build predictive models and perform classification, feature engineering, model evaluation, and exploratory analysis.',
    technologies: ['Python', 'Scikit-learn', 'Pandas', 'NumPy'],
    iconName: 'cpu',
  },
];

export interface ExperienceItem {
  id: string;
  index: string;
  position: string;
  company: string;
  period?: string;
  responsibilities: string[];
}

export const EXPERIENCE_DATA: ExperienceItem[] = [
  {
    id: 'knovista-da',
    index: '01',
    position: 'Data Analytics Intern',
    company: 'Knovista Technologies, Kochi',
    period: 'January 2026 – April 2026',
    responsibilities: [
      'Analysed datasets using Python, SQL, and Excel to generate business insights.',
      'Performed data cleaning and preprocessing using Pandas and NumPy.',
      'Built interactive dashboards and reports using Power BI and Tableau.',
      'Conducted Exploratory Data Analysis (EDA) and KPI analysis.',
      'Wrote SQL queries for data extraction, filtering, and reporting.',
      'Created data visualizations using Matplotlib and Seaborn.',
      'Assisted in machine learning model development and predictive analysis.',
    ],
  },
  {
    id: 'knovista-fsd',
    index: '02',
    position: 'Python Full-Stack Developer Intern',
    company: 'Knovista Technologies, Kochi',
    period: 'August 2025 – December 2025',
    responsibilities: [
      'Reduced P95 API latency by approximately 25% on high-traffic endpoints through N+1 query elimination, query refactoring, and composite indexing.',
      'Architected three DRF services covering authentication, catalog, and orders with JWT authentication and RBAC.',
      'Designed normalized relational database schemas and maintained referential integrity.',
      'Integrated Django REST APIs with React.js components.',
      'Implemented response caching, database indexing, and pagination.',
      'Documented API endpoints using Postman and Swagger.',
    ],
  },
  {
    id: 'ediglobe-ai',
    index: '03',
    position: 'AI Intern – Internship Program',
    company: 'EdiGlobe',
    responsibilities: [
      'Built and evaluated machine learning models for prediction and classification using Scikit-learn.',
      'Explored Machine Learning, NLP, Generative AI, and Large Language Models.',
      'Developed a Car Price Prediction system using Python and machine learning algorithms.',
      'Worked with AI development tools and predictive analytics concepts.',
    ],
  },
];

export interface ProjectItem {
  id: string;
  number: string;
  title: string;
  fullTitle: string;
  category: string;
  completed?: string;
  githubUrl?: string;
  imageUrl: string;
  imageAlt: string;
  stack: string[];
  description: string;
  contributions: string[];
  previewType: 'ml' | 'assetsphere' | 'rentacar';
}

export const PROJECTS_DATA: ProjectItem[] = [
  {
    id: 'lead-conversion-prediction',
    number: '01',
    title: 'Lead Conversion Prediction',
    fullTitle: 'Predictive Lead Conversion Analytics Pipeline',
    category: 'Machine Learning · Data Analytics',
    imageUrl: leadPredictionImg,
    imageAlt:
      'Lead Conversion Prediction machine learning ROC-AUC curve and feature importance visualization',
    stack: [
      'Python',
      'Pandas',
      'NumPy',
      'Scikit-learn',
      'Matplotlib',
      'Seaborn',
    ],
    description:
      'Developed a machine learning solution to predict customer lead conversion by analysing customer-related attributes and identifying patterns influencing conversion outcomes.',
    contributions: [
      'Performed data cleaning and preprocessing.',
      'Applied categorical encoding and feature engineering.',
      'Conducted exploratory data analysis to identify conversion trends.',
      'Trained Logistic Regression, Random Forest, and Support Vector Machine models.',
      'Evaluated models using Accuracy, Precision, Recall, F1-Score, and ROC-AUC.',
      'Created analytical visualizations using Matplotlib and Seaborn.',
    ],
    previewType: 'ml',
  },
  {
    id: 'assetsphere',
    number: '02',
    title: 'AssetSphere',
    fullTitle: 'Asset Inventory Management System',
    category: 'Full Stack · Backend Engineering',
    completed: 'February 2026',
    githubUrl: 'https://github.com/abhinavp00/AssetSphere',
    imageUrl: assetSphereImg,
    imageAlt:
      'AssetSphere Asset Inventory Management System admin dashboard with inventory table and status charts',
    stack: [
      'Python',
      'Django',
      'Django REST Framework',
      'React.js',
      'PostgreSQL',
      'MySQL',
      'Docker',
    ],
    description:
      'Developed a full-stack asset inventory management platform designed to manage asset lifecycles, monitor asset statuses, and provide reporting capabilities through a centralized system.',
    contributions: [
      'Developed REST APIs for asset CRUD operations, status tracking, and bulk operations.',
      'Implemented multi-role reporting dashboards.',
      'Reduced report generation time by approximately 40% through database indexing and query optimization.',
      'Developed a React.js admin dashboard with real-time asset tracking and filtering.',
      'Implemented CSV export functionality.',
      'Covered API logic with Pytest unit tests.',
    ],
    previewType: 'assetsphere',
  },
  {
    id: 'rent-a-car',
    number: '03',
    title: 'Rent-A-Car',
    fullTitle: 'Vehicle Booking Platform',
    category: 'Full Stack Web Application',
    completed: 'November 2025',
    githubUrl: 'https://github.com/abhinavp00/Rent-A-Car-Full-Stack',
    imageUrl: rentACarImg,
    imageAlt:
      'Rent-A-Car vehicle booking platform interface displaying car fleet and booking calendar',
    stack: [
      'Python',
      'Django',
      'Django REST Framework',
      'React.js',
      'MySQL',
      'JavaScript',
      'Postman',
    ],
    description:
      'Built an end-to-end vehicle booking platform with authentication, booking management, and integrated frontend-backend workflows.',
    contributions: [
      'Developed vehicle booking workflows.',
      'Implemented JWT authentication.',
      'Created session and state management functionality.',
      'Implemented concurrent-booking validation.',
      'Integrated React.js interfaces with Django REST APIs.',
      'Optimized MySQL queries using composite indexes.',
    ],
    previewType: 'rentacar',
  },
];

export interface EducationItem {
  degree: string;
  institution: string;
  university?: string;
  performance: string;
  period: string;
}

export const EDUCATION_DATA: EducationItem[] = [
  {
    degree: 'Bachelor of Computer Applications (BCA)',
    institution: 'SES College of Sreekandapuram, Kerala',
    university: 'Kannur University',
    performance: '72.17%',
    period: '2022 – 2025',
  },
  {
    degree: 'Higher Secondary Education (HSE)',
    institution: 'Brennan HSS, Kerala',
    performance: '87.00%',
    period: '2022',
  },
];

export interface CertificationItem {
  index: string;
  title: string;
  issuer: string;
}

export const CERTIFICATIONS_DATA: CertificationItem[] = [
  {
    index: '01',
    title: 'AI Internship Program',
    issuer: 'EdiGlobe in collaboration with IIT Kharagpur',
  },
  {
    index: '02',
    title: 'Python Full-Stack Development with React',
    issuer: 'Knovista Technologies',
  },
  {
    index: '03',
    title: 'Data Analytics',
    issuer: 'Knovista Technologies',
  },
  {
    index: '04',
    title: 'Android Application Development',
    issuer: 'Riss Technologies',
  },
  {
    index: '05',
    title: 'Blue Prism Foundation Training',
    issuer: 'SS&C Blue Prism University',
  },
];
