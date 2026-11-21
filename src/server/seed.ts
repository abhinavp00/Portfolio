import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { count, eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import {
  adminUsers,
  certifications,
  contactInformation,
  education,
  portfolioProfile,
  portfolioSettings,
  professionalExperience,
  projects,
  resumeFiles,
  services,
  skillCategories,
  skills,
} from '../db/schema.ts';
import { hashPassword } from './password.ts';

let seedPromise: Promise<void> | null = null;
let hasVerifiedSeed = false;

async function ensurePrimaryAdminCredentials(): Promise<void> {
  const email = 'abhinavp06082004@gmail.com';
  const existing = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);

  const initialPassword = (process.env.ADMIN_INITIAL_PASSWORD || '').trim();
  const computedHash = initialPassword ? hashPassword(initialPassword) : null;

  if (!existing[0]) {
    await db.insert(adminUsers).values({
      email,
      username: 'Abhinavp',
      passwordHash: computedHash,
      displayName: 'Abhinav P',
      role: 'super_admin',
      isActive: true,
    });
    return;
  }

  const updates: Partial<typeof adminUsers.$inferInsert> = {};
  if (!existing[0].username) {
    updates.username = 'Abhinavp';
  }
  if (!existing[0].passwordHash && computedHash) {
    updates.passwordHash = computedHash;
  }
  if (Object.keys(updates).length > 0) {
    updates.updatedAt = new Date();
    await db.update(adminUsers).set(updates).where(eq(adminUsers.id, existing[0].id));
  }
}

async function runSeed(): Promise<void> {
  await ensurePrimaryAdminCredentials();

  const existingProfiles = await db.select({ total: count() }).from(portfolioProfile);
  if ((existingProfiles[0]?.total ?? 0) > 0) {
    hasVerifiedSeed = true;
    return;
  }

  // Seed portfolio profile
  await db.insert(portfolioProfile).values({
    fullName: 'Abhinav P',
    jobTitle: 'Data Analytics & Python Full Stack Developer',
    secondaryJobTitle: 'Backend Engineering | AI & Agentic Development',
    profileImageUrl: '/assets/aistudio/main_pro_00396858.png',
    location: 'Kerala, India',
    availabilityLabel: 'Available for Opportunities · Kerala, India',
    availabilityStatus: 'available',
    greeting: "Hello, I'm",
    heroHeading: 'Abhinav P',
    heroDescription:
      'I build intelligent, data-driven applications and scalable backend systems by combining Python engineering, data analytics, modern web technologies, and AI-powered development.',
    heroHighlights: [
      'Python Development',
      'Data Analytics',
      'Backend Engineering',
      'AI & Automation',
    ],
    focusAreas: [
      'Backend Engineering',
      'Data Analytics',
      'Full Stack Development',
    ],
    aboutSectionLabel: '01 · About Me',
    aboutHeading: 'Turning Data Into Insights. Turning Ideas Into Applications.',
    aboutDescription:
      'I am a Data Analytics and Backend Developer with hands-on experience in building data-driven systems, analytics dashboards, and optimizing Django REST APIs for asset management and e-commerce platforms.',
    aboutParagraphs: [
      'I am a Data Analytics and Backend Developer with hands-on experience in building data-driven systems, analytics dashboards, and optimizing Django REST APIs for asset management and e-commerce platforms.',
      'I specialize in Python, Django REST Framework, SQL, database optimization, and React-based full-stack development. I have achieved approximately 25% reduction in P95 API latency through N+1 query elimination, composite indexing, and database schema optimization.',
      'My analytical skill set includes data cleaning, exploratory data analysis, data visualization, KPI analysis, and dashboard development using Power BI, Excel, Pandas, NumPy, and SQL.',
      'I also explore AI-assisted software development using Claude and other AI-powered agents, working with Generative AI, Large Language Models, prompt engineering, and agentic workflows to accelerate application development and intelligent business solutions.',
    ],
    professionalSummary:
      'Data Analytics & Python Full Stack Developer focused on high-throughput Django REST APIs, relational SQL optimization, interactive Power BI analytics, and AI-assisted web systems.',
    careerObjective:
      'Seeking impactful roles in Python Backend Engineering, Full Stack Development, and Data Analytics where scalable systems meet measurable data insights.',
    professionalHighlights: [
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
    isPublished: true,
  });

  // Seed contact info
  await db.insert(contactInformation).values({
    email: 'abhinavp06082004@gmail.com',
    phone: '+91 7994826817',
    whatsappNumber: '',
    whatsappEnabled: false,
    linkedinUrl: 'https://www.linkedin.com/in/abhinav-python-dev',
    githubUrl: 'https://github.com/abhinavp00',
    location: 'Kerala, India',
    contactHeading: "Let's Build Something Meaningful Together.",
    contactDescription:
      "Have a project idea, an exciting opportunity, or want to collaborate on something innovative? I'm always interested in connecting with people working on technology, data, and intelligent digital solutions.",
    isPublished: true,
  });

  // Seed portfolio settings
  await db.insert(portfolioSettings).values({
    siteTitle: 'Abhinav P | Data Analytics & Python Full Stack Developer',
    footerCopyright: '© 2026 Abhinav P. All Rights Reserved.',
    enableAnalytics: true,
    requireCookieConsent: true,
    dataRetentionDays: 180,
    whatsappEnabled: false,
    maintenanceMode: false,
    sectionOrder: [
      'hero',
      'about',
      'skills',
      'services',
      'experience',
      'projects',
      'education',
      'certifications',
      'contact',
    ],
  });

  // Seed experience
  await db.insert(professionalExperience).values([
    {
      slug: 'knovista-da',
      indexLabel: '01',
      companyName: 'Knovista Technologies, Kochi',
      jobTitle: 'Data Analytics Intern',
      location: 'Kochi, Kerala',
      employmentType: 'Internship',
      startDate: 'January 2026',
      endDate: 'April 2026',
      periodLabel: 'January 2026 – April 2026',
      isCurrent: false,
      responsibilities: [
        'Analysed datasets using Python, SQL, and Excel to generate business insights.',
        'Performed data cleaning and preprocessing using Pandas and NumPy.',
        'Built interactive dashboards and reports using Power BI and Tableau.',
        'Conducted Exploratory Data Analysis (EDA) and KPI analysis.',
        'Wrote SQL queries for data extraction, filtering, and reporting.',
        'Created data visualizations using Matplotlib and Seaborn.',
        'Assisted in machine learning model development and predictive analysis.',
      ],
      achievements: ['Delivered executive KPI dashboards in Power BI & Tableau'],
      technologies: ['Python', 'SQL', 'Pandas', 'NumPy', 'Power BI', 'Tableau', 'Excel'],
      displayOrder: 1,
      isPublished: true,
    },
    {
      slug: 'knovista-fsd',
      indexLabel: '02',
      companyName: 'Knovista Technologies, Kochi',
      jobTitle: 'Python Full-Stack Developer Intern',
      location: 'Kochi, Kerala',
      employmentType: 'Internship',
      startDate: 'August 2025',
      endDate: 'December 2025',
      periodLabel: 'August 2025 – December 2025',
      isCurrent: false,
      responsibilities: [
        'Reduced P95 API latency by approximately 25% on high-traffic endpoints through N+1 query elimination, query refactoring, and composite indexing.',
        'Architected three DRF services covering authentication, catalog, and orders with JWT authentication and RBAC.',
        'Designed normalized relational database schemas and maintained referential integrity.',
        'Integrated Django REST APIs with React.js components.',
        'Implemented response caching, database indexing, and pagination.',
        'Documented API endpoints using Postman and Swagger.',
      ],
      achievements: ['25% P95 API latency reduction across high-traffic endpoints'],
      technologies: ['Python', 'Django', 'DRF', 'React.js', 'PostgreSQL', 'JWT', 'Swagger'],
      displayOrder: 2,
      isPublished: true,
    },
    {
      slug: 'ediglobe-ai',
      indexLabel: '03',
      companyName: 'EdiGlobe',
      jobTitle: 'AI Intern – Internship Program',
      location: 'Remote',
      employmentType: 'Internship',
      startDate: '',
      endDate: '',
      periodLabel: '',
      isCurrent: false,
      responsibilities: [
        'Built and evaluated machine learning models for prediction and classification using Scikit-learn.',
        'Explored Machine Learning, NLP, Generative AI, and Large Language Models.',
        'Developed a Car Price Prediction system using Python and machine learning algorithms.',
        'Worked with AI development tools and predictive analytics concepts.',
      ],
      achievements: ['Built Car Price Prediction ML pipeline using Scikit-learn'],
      technologies: ['Python', 'Scikit-learn', 'NLP', 'Generative AI', 'LLMs'],
      displayOrder: 3,
      isPublished: true,
    },
  ]);

  // Seed projects
  await db.insert(projects).values([
    {
      slug: 'lead-conversion-prediction',
      numberLabel: '01',
      title: 'Lead Conversion Prediction',
      fullTitle: 'Predictive Lead Conversion Analytics Pipeline',
      category: 'Machine Learning · Data Analytics',
      completed: '',
      description:
        'Developed a machine learning solution to predict customer lead conversion by analysing customer-related attributes and identifying patterns influencing conversion outcomes.',
      stack: ['Python', 'Pandas', 'NumPy', 'Scikit-learn', 'Matplotlib', 'Seaborn'],
      githubUrl: '',
      liveDemoUrl: '',
      imageUrl: 'asset:lead_prediction',
      imageAlt:
        'Lead Conversion Prediction machine learning ROC-AUC curve and feature importance visualization',
      screenshots: [],
      contributions: [
        'Performed data cleaning and preprocessing.',
        'Applied categorical encoding and feature engineering.',
        'Conducted exploratory data analysis to identify conversion trends.',
        'Trained Logistic Regression, Random Forest, and Support Vector Machine models.',
        'Evaluated models using Accuracy, Precision, Recall, F1-Score, and ROC-AUC.',
        'Created analytical visualizations using Matplotlib and Seaborn.',
      ],
      achievements: [
        'Evaluated Logistic Regression, Random Forest, and SVM models with ROC-AUC & F1 metrics',
      ],
      previewType: 'ml',
      isFeatured: true,
      isPublished: true,
      displayOrder: 1,
    },
    {
      slug: 'assetsphere',
      numberLabel: '02',
      title: 'AssetSphere',
      fullTitle: 'Asset Inventory Management System',
      category: 'Full Stack · Backend Engineering',
      completed: 'February 2026',
      description:
        'Developed a full-stack asset inventory management platform designed to manage asset lifecycles, monitor asset statuses, and provide reporting capabilities through a centralized system.',
      stack: [
        'Python',
        'Django',
        'Django REST Framework',
        'React.js',
        'PostgreSQL',
        'MySQL',
        'Docker',
      ],
      githubUrl: 'https://github.com/abhinavp00/AssetSphere',
      liveDemoUrl: '',
      imageUrl: 'asset:assetsphere',
      imageAlt:
        'AssetSphere Asset Inventory Management System admin dashboard with inventory table and status charts',
      screenshots: [],
      contributions: [
        'Developed REST APIs for asset CRUD operations, status tracking, and bulk operations.',
        'Implemented multi-role reporting dashboards.',
        'Reduced report generation time by approximately 40% through database indexing and query optimization.',
        'Developed a React.js admin dashboard with real-time asset tracking and filtering.',
        'Implemented CSV export functionality.',
        'Covered API logic with Pytest unit tests.',
      ],
      achievements: ['Reduced report generation time by ~40% through SQL indexing'],
      previewType: 'assetsphere',
      isFeatured: true,
      isPublished: true,
      displayOrder: 2,
    },
    {
      slug: 'rent-a-car',
      numberLabel: '03',
      title: 'Rent-A-Car',
      fullTitle: 'Vehicle Booking Platform',
      category: 'Full Stack Web Application',
      completed: 'November 2025',
      description:
        'Built an end-to-end vehicle booking platform with authentication, booking management, and integrated frontend-backend workflows.',
      stack: [
        'Python',
        'Django',
        'Django REST Framework',
        'React.js',
        'MySQL',
        'JavaScript',
        'Postman',
      ],
      githubUrl: 'https://github.com/abhinavp00/Rent-A-Car-Full-Stack',
      liveDemoUrl: '',
      imageUrl: 'asset:rentacar',
      imageAlt:
        'Rent-A-Car vehicle booking platform interface displaying car fleet and booking calendar',
      screenshots: [],
      contributions: [
        'Developed vehicle booking workflows.',
        'Implemented JWT authentication.',
        'Created session and state management functionality.',
        'Implemented concurrent-booking validation.',
        'Integrated React.js interfaces with Django REST APIs.',
        'Optimized MySQL queries using composite indexes.',
      ],
      achievements: ['Concurrent-booking validation and JWT session architecture'],
      previewType: 'rentacar',
      isFeatured: true,
      isPublished: true,
      displayOrder: 3,
    },
  ]);

  // Seed skill categories + skills
  const categoriesSeed = [
    {
      slug: 'analytics',
      title: 'Programming & Analytics',
      description:
        'Statistical analysis, data preprocessing, exploratory investigation, and predictive modeling.',
      iconKey: 'analytics',
      displayOrder: 1,
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
      slug: 'backend',
      title: 'Backend Development',
      description:
        'Scalable RESTful service architecture, authentication, role access control, and performance tuning.',
      iconKey: 'backend',
      displayOrder: 2,
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
      slug: 'frontend',
      title: 'Frontend Development',
      description:
        'Responsive component-driven web interfaces integrated cleanly with backend APIs.',
      iconKey: 'frontend',
      displayOrder: 3,
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
      slug: 'visualization',
      title: 'Data Visualization',
      description:
        'Executive KPI dashboards, interactive reporting suites, and business intelligence storytelling.',
      iconKey: 'visualization',
      displayOrder: 4,
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
      slug: 'ai',
      title: 'AI & Agentic Development',
      description:
        'Applying LLMs, prompt engineering, and automated agent workflows to accelerate delivery.',
      iconKey: 'ai',
      displayOrder: 5,
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
      slug: 'databases',
      title: 'Databases',
      description:
        'Relational schema design, migration discipline, composite indexing, and query optimization.',
      iconKey: 'databases',
      displayOrder: 6,
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
      slug: 'tools',
      title: 'Cloud & Development Tools',
      description:
        'Containerized environments, version control workflows, and API testing and documentation.',
      iconKey: 'tools',
      displayOrder: 7,
      skills: ['Docker', 'Git', 'GitHub', 'Postman', 'Swagger'],
    },
  ];

  for (const cat of categoriesSeed) {
    const [insertedCat] = await db
      .insert(skillCategories)
      .values({
        slug: cat.slug,
        title: cat.title,
        description: cat.description,
        iconKey: cat.iconKey,
        displayOrder: cat.displayOrder,
        isPublished: true,
      })
      .returning();

    if (insertedCat && cat.skills.length > 0) {
      await db.insert(skills).values(
        cat.skills.map((skillName, index) => ({
          categoryId: insertedCat.id,
          name: skillName,
          iconUrl: '',
          proficiency: '',
          isEnabled: true,
          displayOrder: index + 1,
        }))
      );
    }
  }

  // Seed services
  await db.insert(services).values([
    {
      numberLabel: '01',
      title: 'Data Analytics & Business Intelligence',
      description:
        'Transform raw datasets into meaningful insights through data cleaning, EDA, statistical analysis, KPI tracking, and interactive dashboards.',
      technologies: ['Python', 'Pandas', 'NumPy', 'SQL', 'Power BI', 'Excel'],
      iconName: 'barChart',
      displayOrder: 1,
      isPublished: true,
    },
    {
      numberLabel: '02',
      title: 'Python Backend Development',
      description:
        'Develop scalable backend applications and secure REST APIs using Python and Django REST Framework.',
      technologies: ['Python', 'Django', 'DRF', 'JWT', 'PostgreSQL'],
      iconName: 'server',
      displayOrder: 2,
      isPublished: true,
    },
    {
      numberLabel: '03',
      title: 'Full Stack Web Development',
      description:
        'Build responsive, end-to-end web applications integrating modern React frontends with robust backend architectures.',
      technologies: ['React.js', 'JavaScript', 'Django', 'REST APIs'],
      iconName: 'layers',
      displayOrder: 3,
      isPublished: true,
    },
    {
      numberLabel: '04',
      title: 'Database Design & Optimization',
      description:
        'Design relational database structures, improve query performance, optimize indexing, and maintain data integrity.',
      technologies: ['PostgreSQL', 'MySQL', 'SQL'],
      iconName: 'database',
      displayOrder: 4,
      isPublished: true,
    },
    {
      numberLabel: '05',
      title: 'AI & Intelligent Application Development',
      description:
        'Explore and develop AI-powered applications using LLMs, prompt engineering, Claude, AI agents, and workflow automation.',
      technologies: ['Claude', 'Google AI Studio', 'n8n', 'Generative AI'],
      iconName: 'sparkles',
      displayOrder: 5,
      isPublished: true,
    },
    {
      numberLabel: '06',
      title: 'Machine Learning Solutions',
      description:
        'Build predictive models and perform classification, feature engineering, model evaluation, and exploratory analysis.',
      technologies: ['Python', 'Scikit-learn', 'Pandas', 'NumPy'],
      iconName: 'cpu',
      displayOrder: 6,
      isPublished: true,
    },
  ]);

  // Seed education
  await db.insert(education).values([
    {
      qualification: 'Bachelor of Computer Applications (BCA)',
      institution: 'SES College of Sreekandapuram, Kerala',
      university: 'Kannur University',
      performance: '72.17%',
      startDate: '2022',
      completionDate: '2025',
      periodLabel: '2022 – 2025',
      displayOrder: 1,
      isPublished: true,
    },
    {
      qualification: 'Higher Secondary Education (HSE)',
      institution: 'Brennan HSS, Kerala',
      university: '',
      performance: '87.00%',
      startDate: '2020',
      completionDate: '2022',
      periodLabel: '2022',
      displayOrder: 2,
      isPublished: true,
    },
  ]);

  // Seed certifications
  await db.insert(certifications).values([
    {
      indexLabel: '01',
      title: 'AI Internship Program',
      issuer: 'EdiGlobe in collaboration with IIT Kharagpur',
      displayOrder: 1,
      isPublished: true,
    },
    {
      indexLabel: '02',
      title: 'Python Full-Stack Development with React',
      issuer: 'Knovista Technologies',
      displayOrder: 2,
      isPublished: true,
    },
    {
      indexLabel: '03',
      title: 'Data Analytics',
      issuer: 'Knovista Technologies',
      displayOrder: 3,
      isPublished: true,
    },
    {
      indexLabel: '04',
      title: 'Android Application Development',
      issuer: 'Riss Technologies',
      displayOrder: 4,
      isPublished: true,
    },
    {
      indexLabel: '05',
      title: 'Blue Prism Foundation Training',
      issuer: 'SS&C Blue Prism University',
      displayOrder: 5,
      isPublished: true,
    },
  ]);

  // Seed initial active resume if public/Abhinav_P_Resume.pdf exists
  try {
    const existingResumes = await db.select({ total: count() }).from(resumeFiles);
    if ((existingResumes[0]?.total ?? 0) === 0) {
      const pdfPath = path.resolve(process.cwd(), 'public', 'Abhinav_P_Resume.pdf');
      if (fs.existsSync(pdfPath)) {
        const buffer = fs.readFileSync(pdfPath);
        if (buffer.subarray(0, 5).toString('ascii') === '%PDF-') {
          const sha256Hash = crypto.createHash('sha256').update(buffer).digest('hex');
          await db.insert(resumeFiles).values({
            versionNumber: 1,
            fileName: 'Abhinav_P_Resume.pdf',
            mimeType: 'application/pdf',
            fileSizeBytes: buffer.length,
            fileDataBase64: buffer.toString('base64'),
            sha256Hash,
            isActive: true,
            uploadedByEmail: 'abhinavp06082004@gmail.com',
          });
        }
      }
    }
  } catch (err) {
    console.error('Initial resume seed warning:', err);
  }

  hasVerifiedSeed = true;
}

export async function ensureDatabaseSeeded(): Promise<void> {
  if (hasVerifiedSeed) return;
  if (!seedPromise) {
    seedPromise = runSeed().catch((err) => {
      seedPromise = null;
      throw err;
    });
  }
  await seedPromise;
}
