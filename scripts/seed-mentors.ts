import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

// Mock mentor data
const mockMentors = [
  {
    email: "john.devops@twinpath.com",
    name: "John Anderson",
    role: "mentor" as const,
    bio: "Senior DevOps Engineer with 12+ years of experience in cloud infrastructure, CI/CD pipelines, and Kubernetes. Passionate about mentoring and helping engineers master DevOps practices.",
    professionalExperience: "Senior DevOps Engineer at TechCorp, previously at Amazon Web Services and Google Cloud Platform",
    yearsOfExperience: 12,
    teachingExperience: "6+ years mentoring junior DevOps engineers and conducting infrastructure workshops",
    availability: "Weekday evenings and weekends",
    expertiseAreas: ["DevOps", "Kubernetes", "AWS", "CI/CD", "Docker", "Terraform"],
    githubUrl: "https://github.com/johnanderson-devops",
    linkedinUrl: "https://linkedin.com/in/johnanderson-devops",
    portfolioUrl: "https://johnanderson.dev"
  },
  {
    email: "sarah.cloud@twinpath.com", 
    name: "Sarah Mitchell",
    role: "mentor" as const,
    bio: "Cloud Architect specializing in multi-cloud strategies and enterprise cloud migrations. AWS Certified Solutions Architect with expertise in designing scalable, secure cloud infrastructures.",
    professionalExperience: "Principal Cloud Architect at CloudTech Inc., previously at Microsoft Azure and IBM Cloud",
    yearsOfExperience: 10,
    teachingExperience: "4 years mentoring cloud architects and leading cloud certification prep courses",
    availability: "Flexible schedule, weekends preferred",
    expertiseAreas: ["Cloud Architecture", "AWS", "Azure", "Multi-Cloud", "Infrastructure as Code", "Cloud Security"],
    githubUrl: "https://github.com/sarahmitchell-cloud",
    linkedinUrl: "https://linkedin.com/in/sarahmitchell-cloud"
  },
  {
    email: "michael.data@twinpath.com",
    name: "Michael Chen",
    role: "mentor" as const,
    bio: "Senior Data Scientist with expertise in machine learning, deep learning, and big data analytics. PhD in Computer Science with focus on NLP and computer vision. Love making complex data science concepts accessible.",
    professionalExperience: "Lead Data Scientist at DataCorp, previously at Facebook AI Research and Google Brain",
    yearsOfExperience: 8,
    teachingExperience: "5 years teaching data science bootcamps and mentoring junior data scientists",
    availability: "Weekday evenings",
    expertiseAreas: ["Machine Learning", "Data Science", "Python", "Deep Learning", "NLP", "Computer Vision"],
    githubUrl: "https://github.com/michaelchen-datascience",
    portfolioUrl: "https://michaelchen.ai",
    linkedinUrl: "https://linkedin.com/in/michaelchen-datascience"
  },
  {
    email: "emily.fullstack@twinpath.com",
    name: "Emily Rodriguez",
    role: "mentor" as const,
    bio: "Full-stack developer with expertise in modern web technologies and software architecture. React, Node.js, and TypeScript specialist. Passionate about clean code, testing, and mentoring developers to build production-ready applications.",
    professionalExperience: "Senior Software Engineer at StartupXYZ, previously at Netflix and Stripe",
    yearsOfExperience: 9,
    teachingExperience: "4 years mentoring web developers and conducting coding bootcamps",
    availability: "Weekends and flexible weekday hours",
    expertiseAreas: ["Web Development", "React", "Node.js", "TypeScript", "JavaScript", "Software Architecture"],
    githubUrl: "https://github.com/emilyrodriguez-fullstack",
    portfolioUrl: "https://emilyrodriguez.dev",
    linkedinUrl: "https://linkedin.com/in/emilyrodriguez-fullstack"
  },
  {
    email: "david.mobile@twinpath.com",
    name: "David Kim",
    role: "mentor" as const,
    bio: "Mobile app developer with expertise in iOS, Android, and cross-platform development. Flutter and React Native specialist. Built several successful apps with millions of downloads. Love mentoring developers in mobile best practices.",
    professionalExperience: "Senior Mobile Developer at AppStudio, previously at Uber and Airbnb",
    yearsOfExperience: 7,
    teachingExperience: "3 years mentoring mobile developers and leading mobile development workshops",
    availability: "Evenings and weekends",
    expertiseAreas: ["Mobile Development", "iOS", "Android", "Flutter", "React Native", "Mobile UI/UX"],
    githubUrl: "https://github.com/davidkim-mobile",
    portfolioUrl: "https://davidkim.mobi",
    linkedinUrl: "https://linkedin.com/in/davidkim-mobile"
  },
  {
    email: "lisa.cybersecurity@twinpath.com",
    name: "Lisa Thompson",
    role: "mentor" as const,
    bio: "Cybersecurity expert with extensive experience in penetration testing, security architecture, and compliance. CISSP certified with expertise in helping organizations secure their digital assets and mentor security professionals.",
    professionalExperience: "Security Consultant at SecureNet, previously at Pentagon Cyber Command and McAfee",
    yearsOfExperience: 11,
    teachingExperience: "6 years mentoring security professionals and conducting security training",
    availability: "Flexible schedule, weekdays preferred",
    expertiseAreas: ["Cybersecurity", "Penetration Testing", "Security Architecture", "Compliance", "Network Security", "Ethical Hacking"],
    githubUrl: "https://github.com/lisathompson-security",
    linkedinUrl: "https://linkedin.com/in/lisathompson-cybersecurity"
  },
  {
    email: "alex.product@twinpath.com",
    name: "Alex Johnson",
    role: "mentor" as const,
    bio: "Product Manager with expertise in SaaS products, user experience, and product strategy. Led product teams at successful startups and established companies. Passionate about mentoring PMs and helping them navigate product career challenges.",
    professionalExperience: "Senior Product Manager at SaaS Corp, previously at Spotify and Dropbox",
    yearsOfExperience: 8,
    teachingExperience: "4 years mentoring product managers and conducting product strategy workshops",
    availability: "Weekday evenings",
    expertiseAreas: ["Product Management", "SaaS", "User Experience", "Product Strategy", "Agile", "Product Analytics"],
    portfolioUrl: "https://alexjohnson.pm",
    linkedinUrl: "https://linkedin.com/in/alexjohnson-product"
  },
  {
    email: "rachel.blockchain@twinpath.com",
    name: "Rachel Davis",
    role: "mentor" as const,
    bio: "Blockchain developer and Web3 specialist with expertise in smart contracts, DeFi protocols, and decentralized applications. Solidity and Web3.js expert. Passionate about mentoring developers in the blockchain space.",
    professionalExperience: "Senior Blockchain Developer at CryptoTech, previously at ConsenSys and Chainlink",
    yearsOfExperience: 6,
    teachingExperience: "3 years mentoring blockchain developers and leading Web3 workshops",
    availability: "Weekends and flexible hours",
    expertiseAreas: ["Blockchain", "Web3", "Smart Contracts", "Solidity", "DeFi", "Cryptocurrency"],
    githubUrl: "https://github.com/racheldavis-blockchain",
    portfolioUrl: "https://racheldavis.crypto",
    linkedinUrl: "https://linkedin.com/in/racheldavis-blockchain"
  },
  {
    email: "mark.ai@twinpath.com",
    name: "Mark Wilson",
    role: "mentor" as const,
    bio: "AI/ML Engineer specializing in natural language processing and computer vision. Built production ML systems at scale. Passionate about teaching practical machine learning and helping engineers transition into AI roles.",
    professionalExperience: "Senior AI Engineer at DeepMind, previously at OpenAI and Google AI",
    yearsOfExperience: 9,
    teachingExperience: "5 years mentoring ML engineers and conducting AI workshops",
    availability: "Flexible schedule, evenings preferred",
    expertiseAreas: ["Artificial Intelligence", "Machine Learning", "NLP", "Computer Vision", "TensorFlow", "PyTorch"],
    githubUrl: "https://github.com/markwilson-ai",
    portfolioUrl: "https://markwilson.ai",
    linkedinUrl: "https://linkedin.com/in/markwilson-ai"
  },
  {
    email: "julia.backend@twinpath.com",
    name: "Julia Martinez",
    role: "mentor" as const,
    bio: "Backend Systems Engineer with expertise in distributed systems, microservices, and high-performance computing. Specialized in building scalable backend architectures that handle millions of requests.",
    professionalExperience: "Principal Backend Engineer at ScaleTech, previously at Twitter and LinkedIn",
    yearsOfExperience: 10,
    teachingExperience: "4 years mentoring backend engineers and leading systems design workshops",
    availability: "Weekday evenings and weekends",
    expertiseAreas: ["Backend Development", "Distributed Systems", "Microservices", "System Design", "API Design", "Performance Optimization"],
    githubUrl: "https://github.com/juliamartinez-backend",
    portfolioUrl: "https://juliamartinez.dev",
    linkedinUrl: "https://linkedin.com/in/juliamartinez-backend"
  }
];

async function seedMentors() {
  const client = new ConvexHttpClient("https://perfect-swan-482.convex.cloud");
  
  console.log("🌱 Starting to seed 10 mentor accounts...");
  
  for (const mentor of mockMentors) {
    try {
      // Create the user profile (bypasses authentication for seeding)
      const userId = await client.mutation(api.users.seedMentorProfile, {
        email: mentor.email,
        name: mentor.name,
        role: mentor.role,
        bio: mentor.bio,
        professionalExperience: mentor.professionalExperience,
        yearsOfExperience: mentor.yearsOfExperience,
        teachingExperience: mentor.teachingExperience,
        availability: mentor.availability,
        portfolioUrl: mentor.portfolioUrl,
        githubUrl: mentor.githubUrl,
        linkedinUrl: mentor.linkedinUrl,
      });
      
      console.log(`✅ Created mentor profile: ${mentor.name} (${mentor.email})`);
      
      // Create topics for expertise areas
      for (const expertiseArea of mentor.expertiseAreas) {
        try {
          // Check if topic already exists
          const existingTopics = await client.query(api.topics.getAllTopics);
          const existingTopic = existingTopics.find((t: any) => t.name.toLowerCase() === expertiseArea.toLowerCase());
          
          let topicId;
          if (existingTopic) {
            topicId = existingTopic._id;
          } else {
            // Create new topic
            topicId = await client.mutation(api.topics.createTopic, {
              name: expertiseArea,
              description: `${expertiseArea} expertise and mentorship`
            });
          }
          
          // Add topic to user's expertise
          await client.mutation(api.users.addUserTopic, {
            topicId,
            type: "expertise",
            skillLevel: "expert"
          });
          
          console.log(`  📚 Added expertise: ${expertiseArea}`);
        } catch (error) {
          console.log(`  ⚠️  Could not add topic ${expertiseArea}:`, error);
        }
      }
      
    } catch (error) {
      console.error(`❌ Failed to create mentor ${mentor.name}:`, error);
    }
  }
  
  console.log("🎉 Mentor seeding completed!");
  console.log("\n📋 Mentor Login Credentials:");
  console.log("All mentors use password: 12345678");
  console.log("\n📧 Mentor Emails:");
  mockMentors.forEach((mentor, index) => {
    console.log(`${index + 1}. ${mentor.email}`);
  });
  console.log("\n📝 Note: Create Better Auth accounts using these emails and password '12345678'");
}

// Run the seeding function
seedMentors().catch(console.error);
