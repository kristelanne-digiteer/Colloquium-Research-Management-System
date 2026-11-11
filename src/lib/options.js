// Choices for the dropdowns on Sign up and Account settings.
// The text of the option is what gets saved in the database.

// ---------------------------------------------------------------------------
// FIELD OF STUDY (grouped)
// To edit: each block below is one group. The first line of a block is the group
// name, the lines under it are the choices. Separate blocks with a blank line.
// ---------------------------------------------------------------------------
const FIELD_OF_STUDY_RAW = `
Agriculture
Agricultural - General
Agricultural Extension
Agronomy/Plant & Soil Sciences
Animal Genomics
Animal Science
Biosystems Engineering
Botany
Dairy Science
Economics
Engineering/Engineering Extension
Entomology
Environmental Science & Ecology
Food & Nutritional Science
Forest Ecology & Management
Horticulture
Landscape Architecture
Land & Water Resource Engineering
Meat Science
Pathobiology
Plant Genetics
Plant Pathology
Poultry Science
Statistics
Veterinary Science/Medicine
Viticulture and Enology
Water Management/Policy
Zoology/Genetics

Business
Business - General
Accounting and/or Taxes
Arts Administration
Business Communications
Business Ethics
Business Law
Construction Management
Decision Sciences
Economics
Entrepreneurship
Finance
General Management
Health Systems Management
Hospitality/Tourism Management
Human Resources
Insurance/Risk Management
International Business
Logistics/Supply Chain Management
Management Information Systems - All
Marketing
MBA & Executive MBA
Nonprofit Organizations
Organizational Studies
Production/Operations Management
Public Policy & Administration
Real Estate
Quantitative Analysis
Sport Management
Statistics & Actuarial Science
Technology & Information Management

Community Colleges
Administration - Executive
Administration - Academic Unit
Administration - Accounting & Finance
Administration - Counseling Services
Administration - Human Resources
Administration - Student Affairs
Administration - Undergraduate Education
Administration - Other
Agriculture/Vet Med
Business
Culinary Arts/Food Management
Education
Engineering
Fine Arts - Dance
Fine Arts - Drama/Theater
Fine Arts - Music
Fine Arts - Visual Arts
Fine Arts - Other
Health Sciences
Humanities - English
Humanities - Foreign Languages
Humanities - History
Humanities - Literature
Humanities - Philosophy
Humanities - Other
Law
Medicine
Sciences - Biological
Sciences - Chemistry
Sciences - Computer Science
Sciences - Math
Sciences - Physics
Sciences - Other
Social Sciences - Communication
Social Sciences - Economics
Social Sciences - Geography
Social Sciences - Political Science
Social Sciences - Psychology
Social Sciences - Sociology
Social Sciences - Other
Vocational/Technical

Curriculum & Education
Education - General
Administration/Supervision
Adult and Distance Education
Art Education
Audiology/Speech Pathology
Counseling/Human Services
Childhood/Youth Education
Curriculum/Instruction
Education Policy
Educational Psychology/Behavior Analysis
Educational Technology
Elementary Education
English Education
English as a Second Language
Health & Human Performance
Higher Education Administration
Human Development
Information Studies
Instructional Design/Technology
Math Education
Middle School
Music Education
Reading/Developmental Education
Organization and Leadership
Physical Education & Kinesiology
Professional Development
Rehabilitation Counseling/Psychology
Science Education
Secondary Education
Social Foundations
Sociology
Special Education
Sports Studies
Teacher Education
Urban Education
Vocational/Technical

Dentistry
Dentistry - General
Biological/Materials Sciences
Cariology
Dental Anesthesiology
Dental Hygiene
Dental Technology
Dentistry & Stomatology
Endodontics
Family Dentistry
Gerodontology
Oral & Maxillofacial Surgery
Oral Biology
Oral Medicine/Pathology/Oncology
Oral Radiology
Orthodontics
Pediatric Dentistry
Periodontics/Periodontology
Preventive & Community Dentistry
Prosthodontics/Restorative Dentistry
Public Health/Epidemiology

Engineering
Engineering - Other
Aerospace/Aeronautical/Astronautics
Agricultural
Architectural (Building & Construction)
Artificial Intelligence
Biomedical Engineering & Bioengineering
Chemical/Petroleum
Civil Engineering
Construction Engineering/Management
Computer Science
Computer Engineering
Education Systems & Design
Electrical and/or Electronics
Energy Technology
Engineering Mechanics
Engineering Physics
Ecological and Environmental
Food Process Engineering
Geomatics
Geotechnical
Human Factors Engineering/Ergonomics
Industrial & Systems Engineering
Manufacturing & Quality Engineering
Material/Metallurgy
Mechanical Engineering
Mechatronics
Mining/Minerals
Naval Architecture & Marine Engineering
Nuclear
Ocean Engineering
Optics & Optical Engineering
Polymer Science
Pulp & Paper Science
Risk Management & Financial Engineering
Robotics
Structural Engineering
Sustainable Engineering
Textile Engineering
Transportation Engineering
Water Resources Engineering

Fine Arts
Fine Arts - General
Architecture/Landscape Architecture
Art Administration
Art Education
Art History
Art - General
Art - Ceramics
Art - Painting/Drawing
Art - Photography
Art - Printmaking
Art - Sculpture
Communications/Information Systems
Culinary Arts/Gastronomy
Dance
Design - Fashion & Textile Design
Design - Graphic Design/Illustration
Design - Industrial Art/Design
Design - Interior Design
Design - Jewelery Design
Design - Product Design
Digital Media
Drama/Theater/Theater Education
Film/Video
Game Design/Animation
Music Education
Music Industry Studies
Music - General
Music - Classical
Music - Composition
Music - Conducting
Music - Ethnomusicology
Music - Jazz
Music - Musicology/Music History
Music - Vocal
Music - Orchestra/Symphony
Music - Piano/Organ/Keyboard
Music - Psychology
Music - Scientific Study/Theory
Music - Song Performance
Performance Studies
Television/Media Studies

Health Sciences
Health Sciences - General
Acupuncture/Oriental Medicine
Allied Health Professions
Anatomy & Applied Anatomy
Anesthesiology
Audiology
Biomedical Sciences
Chiropractic
Clinical Psychology
Communication Disorders
Community Health
Dental Hygiene/Dental Assisting
Emergency Medicine
Environmental/Occupational Health
Family Medicine
Forensic Sciences
Health Administration & Policy
Health Economics
Health Education & Promotion
Health Services Management
Health Services/Research & Policy
Health Wellness & Injury Prevention
Hospice/Palliative Care
Immunology & Infectious Diseases
Industrial Hygiene
Informatics - All Categories
Medical Microbiology
Medicine/Laboratory Medicine
Midwifery
Neurodevelopmental Disorders
Nutrition and Dietetics
Nursing - General
Nursing - Administration
Nursing - Adult Care
Nursing - Clinical (all categories)
Nursing - Geriatrics
Nursing - Licensed Practical Nurse (LPN)
Nursing - Obstetrics & Gynecology
Nursing - Pediatric
Nursing - Practitioner (all categories)
Nursing - Psychiatric
Nursing - Women's Health
Occupational Therapy
Optometry/Vision Science
Pathology
Pharmaceutical Sciences
Physical Education & Kinesiology
Physical Therapy/Rehabilitation
Physician Assistant
Physiology/Exercise Physiology
Physiology/Human Physiology
Public Health/Biostatistics/Epidemiology
Public Health/Management/Administration
Rehabilitation Counseling
Respiratory Therapy
Social and Behavioral Medicine
Social Work
Speech/Hearing Sciences
Sport & Exercise Science
Toxicology
Women's Health

Humanities
Humanities - General
African American Studies
American Studies
Anthropology
Archaeology
Applied Linguistics
Classics
Communication
Creative or Technical Writing
English
English as a Second Language
Ethnic/Multicultural Studies
Foreign Languages/Literatures
LGBTQ Studies
History - General
History - Art
History - African
History - African American
History - Asian
History - Cultural
History - European
History - Latin American
History - Middle East
History - Modern U.S.
History - U.S. Colonial
History - Women's
Interdisciplinary Studies
Journalism
Latina/o Studies
Linguistics
Literature - General
Literature - Comparative
Literature - 18th-to-20th-Century British
Literature - African-American
Literature - American After 1865
Literature - Colonial American
Literature - and Gender
Literature - Criticism and Theory
Literature - Medieval/Renaissance
Middle Eastern Studies
Native American Studies
Museum Studies
Philosophy
Religion and Theology
Speech/Rhetoric
Women's Studies

K-12 Education
Elementary Education
Administration
Computer Science / Technology
ELL / ESOL / ESL
English / Reading / Language Arts
Art/Music/Theater
Health/Behavioral Health
Math
Montessori/Preschool
Physical Education
Religion
Science
Social Studies/History
Special Education
Professional Staff
World Languages
Staff
Vocational/Technical
Other

Law
Speech / Communication
Law - General
Administrative Law
Appellate Advocacy
Arbitration/Mediation/Dispute Resolution
Banking, Business & Financial Law
Clinical Training
Commercial & Bankruptcy Law
Constitutional Law
Consumer Law/Product Liability
Contracts
Copyright/Trademark/Intellectual Property/Patent
Corporate Law
Courts and Procedures
Criminal Law
Death Penalty
Election/Voting Law
Employment/Employee/Labor Law
Environmental/Natural Resource Law
Estate Planning/Wills & Trusts
Family/Juvenile/Child Law
Federal Courts & Jurisdiction
Federal Indian Law
Healthcare Law
History of Law
Human Rights
Indigenous and Aboriginal Law
International Law
Jurisprudence
Landlord/Tenant & Housing Law
Law & Technology
Law and Public Policy
Legal Ethics
Legal Research & Writing
Litigation
Military Law
Privacy
Real Property & Real Estate Finance
Sports Law
State & Local Government
Tax Law
Torts & Tort Reform
Trial Advocacy
Zoning/Land Use Planning

Medicine
Medicine - General
Allergy/Rheumatology
Anatomy
Anesthesiology
Biochemistry & Cellular Biology
Bioethics
Biomedical Engineering/Biomedical Sciences
Cardiology/Cardiovascular Medicine
Clinical Research
Dermatology
Diagnostic Radiology/Nuclear Medicine
Emergency Medicine
Endocrinology/Metabolism/Nutrition
Family & Community Medicine
Gastroenterology
Genetics, Genomics & Molecular Biology
Geriatrics
Health Policy/Management/Administration
History & Philosophy of Medicine
Homeopathy
Hospice/Palliative Care
Immunology & Infectious Diseases
Internal Medicine
Medical Informatics & Clinical Epidemiology
Microbiology & Virology
Musculoskeletal Medicine
Nephrology
Neurobiology/Neuroscience
Neurology
Neurosurgery
Obstetrics & Gynecology
Oncology & Hematology
Ophthalmology
Orthopedics & Orthopedic Surgery
Osteopathy
Otolaryngology/Head & Neck Surgery
Pathology & Laboratory Medicine
Pediatrics - All Categories
Pharmacology & Toxicology
Physical Medicine & Rehabilitation
Physician Assistant
Physiology & Biophysics
Plastic/Reconstructive Surgery
Preventive Medicine
Psychiatry/Psychology/Behavioral Science
Public Health & Epidemiology
Pulmonary & Critical Care Medicine
Radiation Oncology
Radiology & Radiological Sciences
Sleep Medicine
Surgery - General
Transplant Surgery
Urology
Vascular Biology
Vascular Surgery

Pharmacy
Pharmacy - General
Administration
Biomedical Sciences
Biopharmaceutical Sciences
Clinical Pharmacy
Clinical Sciences
Economics & Policy Studies
Medicinal Chemistry
Molecular Pharmacology
Natural Products Chemistry
Pharmaceutical Chemistry
Pharmaceutical Sciences
Pharmaceutics
Pharmacokinetics
Pharmacology
Pharmacotherapy
Pharmacy Practice
Therapeutics
Toxicology

Sciences
Sciences - General
Anatomy/Physiology
Artificial Intelligence
Astronomy and Astrophysics
Atmospheric Sciences
Biology - General
Biology - Developmental/Evolutionary
Biology - Genetics
Biology - Biochemistry
Biology - Biostatistics
Biology - Cell Biology
Biology - Computational
Biology - Microbiology
Biology - Molecular
Biology - Neuroscience/Neurobiology
Biology - Reproductive
Biomedical Sciences
Botany/Plant Sciences
Chemistry - General
Chemistry - Analytical
Chemistry - Biochemistry
Chemistry - Inorganic
Chemistry - Medicinal
Chemistry - Organic
Chemistry - Physical
Computer/Information Sciences
Earth Sciences
Environmental Sciences/Ecology/Forestry
Fire Sciences
Food Sciences/Technology/Toxicology
Forensic Sciences
Geodetic Sciences
Geology/Geosciences - General
Geology - Geochemistry
Geology - Geophysics
Geology - GIS
Geology - Hydrogeology
Geology - Paleontology
Geology - Sedimentology/Stratigraphy
Geology - Tectonics/Structure
Geography
Industrial Design/Technology
Marine/Freshwater Sciences
Materials Sciences/Polymer Sciences
Mathematics/Applied Mathematics
Natural Sciences
Nanotechnology
Occupational Health/Safety
Physics - General
Physics - Atomic/Molecular/Optical/Plasma
Physics - Condensed Matter/Low Temperature
Physics - Elementary Particles/Nuclear
Planetary Sciences
Statistics & Actuarial Science
Textile Sciences

Senior Administration
University Administration
Senior Administration
Administration - General
Administration - Academic Unit
Academic Advising
Academic Affairs
Accounting
Admissions/Financial Aid
Alumni Relations
Athletics
Business & Administration
Computing/Informational Services
Continuing Education/Distance Learning
Development/Institutional Advancement
Enrollment Management/Registrar
Facilities Operations
Financial Planning/Budget Management
Governmental Relations
Graduate Education
Health Services
Human Resources
International Programs/Study Abroad
Legal
Library Services
Multicultural Affairs/Diversity
Public Relations/Marketing
Purchasing
Research
Residential Life
Student Affairs
Teaching & Learning
Undergraduate Education
Other Administrative Departments

Social Sciences
Social Sciences - General
Anthropology
Archaeology
Cognitive science
Communications/Journalism (all)
Criminology/Criminal Justice
Economics - General
Economics - Industrial Organization
Economics - International
Economics - Macroeconomics
Economics - Microeconomics
Economics - Public Finance
Economics - Resources
Environmental Policy
Family Studies/Child Development
Gender Studies
Geography
Gerontology
Government - National Security
Government - Policy/Public Affairs
Home Economics/Consumer Sciences
Human Development
Human Ecology
Interdisciplinary Studies
International Relations/Foreign Service
Labor/Industrial Relations
Library Sciences (all categories)
Political Science - General
Political Science - American
Political Science - Comparative
Political Science - International
Political Science - Theory
Psychology - General
Psychology - Behavior Analysis
Psychology - Clinical
Psychology - Cognitive
Psychology - Developmental
Psychology - Educational
Psychology - Experimental
Psychology - Industrial/Organizational
Psychology - Neuropsychology
Psychology - School
Psychology - Social
Public Policy & Administration
Recreation/Leisure studies
Research Methods/Data Analysis
Social Work
Sociology - General
Sociology - Crime, Justice & Law
Sociology - Economic
Sociology - Historical
Sociology - Humanities
Sociology - Social Psychology
Sociology - Social Stratification
Sociology - of Culture
Urban Studies and Planning
Women's Studies

Staff & Non-Managerial Professionals
Administrative Support/Services
Admissions/Student Records/Registrar
Agriculture/Animal Care
Alumni Relations
Arts/Museum/Theater
Athletics and Recreation Services
Child and Social Services
Communications/Public Relations
Counseling Services
Curatorial/Archival
Graphic Design/Marketing
Dining Services
Educational Services
Facilities/Maintenance/Transportation
Finance/Investment Management
Financial Aid
Fiscal Services
Grant Writer/Technical Writer
Health Services
Human Resources
Information Technology
Institutional Advancement
Legal Services
Library
Multicultural Affairs/Diversity
Public Safety
Research/Technical/Laboratory
Residential Life
Student Services

Veterinary Medicine
Veterinary Medicine - General
Anatomy, Physiology, & Cell Biology
Anesthesiology
Animal Genomics
Animal Sciences
Aquatic Animal Health
Avian Medicine
Biomedical Sciences
Biostatistics
Bovine Medicine
Cancer Biology & Oncology
Cardiology & Cardiovascular Science
Clinical/Medical Sciences
Dentistry
Dermatology/Allergy
Emergency Medical Care
Equine Medicine/Surgery
Exotic Animal Medicine
Field Service
Immunology
Large Animal Medicine
Medicine & Epidemiology
Molecular Genetics
Molecular Biosciences/Microbiology
Nutrition & Animal Health
Neurosciences (all categories)
Ophthalmology
Ovine Medicine
Parasitology
Pathology/Pathobiology
Pharmacology
Porcine Medicine
Radiological Sciences
Reproductive Biology/Endocrinology
Small/Lab Animal Medicine
Surgery/Surgical Sciences
Theriogenology
Toxicology
Vaccines
Veterinary Behavior
Virology
`;

const parseGroups = (raw) =>
  raw
    .trim()
    .split(/\r?\n\s*\r?\n/)
    .map((block) => {
      const [group, ...options] = block
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      return { group, options };
    });

// Used by the "Field of study" dropdown: [{ group: 'Business', options: [...] }, ...]
export const FIELD_OF_STUDY_GROUPS = parseGroups(FIELD_OF_STUDY_RAW);

export const EXPERTISE_OPTIONS = [
  'Accounting',
  'Analytics',
  'Banking',
  'Biology',
  'Bookkeeping',
  'Business Analysis',
  'Business Automation',
  'Business Communication',
  'Business Software',
  'Carpentry',
  'Change Management',
  'Compliance',
  'Computer Science',
  'Construction',
  'Cooking',
  'Customer Service',
  'Data Analysis',
  'Design',
  'DevOps',
  'Economics',
  'Engineering',
  'Entrepreneurship',
  'Finance',
  'Heavy Equipment',
  'Hospitality',
  'Human Resource Management',
  'Information Security',
  'Information Technology',
  'Inventory Management',
  'Journalism',
  'Languages',
  'Lead Generation',
  'Lead Qualification',
  'Machine Learning',
  'Machine Operation',
  'Maintenance & Repair',
  'Management',
  'Marketing Communications',
  'Marketing Promotion',
  'Mathematics',
  'Medicine',
  'Operations',
  'Partner Management',
  'Physics',
  'Planning',
  'Process Engineering',
  'Procurement',
  'Product Development',
  'Productivity Software',
  'Programming Languages',
  'Project Management',
  'Public Relations',
  'Public Speaking',
  'Quality Assurance',
  'Real Estate',
  'Relationship Management',
  'Reporting / Metrics',
  'Research',
  'Restaurant Business',
  'Risk Management',
  'Robotics',
  'Sales',
  'Sales Management',
  'Scheduling',
  'Science',
  'Software Design',
  'Software Development',
  'Statistics',
  'Team Management',
  'Training',
  'Troubleshooting',
  'User Experience Design',
  'Visual Communication',
  'Visual Design',
  'Writing',
];
