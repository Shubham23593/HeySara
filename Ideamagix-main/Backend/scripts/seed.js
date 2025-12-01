import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Course from '../models/Course.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas for seeding');

    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@ideamagix.com',
      password: 'admin123', // Will be hashed by pre-save hook
      role: 'admin'
    });
    console.log('✅ Admin user created');

    // Create sample instructors
    const instructor1 = await User.create({
      name: 'John Doe',
      email: 'john@ideamagix.com',
      password: 'instructor123',
      role: 'instructor'
    });

    const instructor2 = await User.create({
      name: 'Jane Smith',
      email: 'jane@ideamagix.com',
      password: 'instructor123',
      role: 'instructor'
    });
    console.log('✅ Instructors created');

    // Create sample courses with lectures
    // Course 1: Web Development Fundamentals
    const course1 = await Course.create({
      name: 'Web Development Fundamentals',
      level: 'Beginner',
      description: 'Learn the basics of HTML, CSS, and JavaScript',
      imageUrl: 'https://picsum.photos/seed/web1/400/225',
      lectures: []
    });

    // Add lectures to course1 with courseId
    course1.lectures.push(
      { 
        title: 'Introduction to HTML', 
        date: new Date('2025-11-20'), 
        duration: 60,
        instructorId: instructor1._id,
        courseId: course1._id
      },
      { 
        title: 'CSS Basics', 
        date: new Date('2025-11-22'), 
        duration: 60,
        instructorId: instructor1._id,
        courseId: course1._id
      },
      { 
        title: 'JavaScript Fundamentals', 
        date: new Date('2025-11-25'), 
        duration: 90,
        courseId: course1._id
      }
    );
    await course1.save();
    console.log('✅ Course 1 created with lectures');

    // Course 2: Advanced React Development
    const course2 = await Course.create({
      name: 'Advanced React Development',
      level: 'Advanced',
      description: 'Master React with hooks, context, and advanced patterns',
      imageUrl: 'https://picsum.photos/seed/react1/400/225',
      lectures: []
    });

    course2.lectures.push(
      { 
        title: 'React Hooks Deep Dive', 
        date: new Date('2025-11-18'), 
        duration: 120,
        instructorId: instructor2._id,
        courseId: course2._id
      },
      { 
        title: 'Context API and State Management', 
        date: new Date('2025-11-21'), 
        duration: 90,
        courseId: course2._id
      },
      { 
        title: 'Advanced React Patterns', 
        date: new Date('2025-11-24'), 
        duration: 90,
        courseId: course2._id
      }
    );
    await course2.save();
    console.log('✅ Course 2 created with lectures');

    // Course 3: Node.js Backend Development
    const course3 = await Course.create({
      name: 'Node.js Backend Development',
      level: 'Intermediate',
      description: 'Build scalable backend applications with Node.js and Express',
      imageUrl: 'https://picsum.photos/seed/node1/400/225',
      lectures: []
    });

    course3.lectures.push(
      { 
        title: 'Express.js Fundamentals', 
        date: new Date('2025-11-17'), 
        duration: 90,
        instructorId: instructor1._id,
        courseId: course3._id
      },
      { 
        title: 'MongoDB and Mongoose', 
        date: new Date('2025-11-19'), 
        duration: 120,
        instructorId: instructor2._id,
        courseId: course3._id
      },
      { 
        title: 'REST API Best Practices', 
        date: new Date('2025-11-23'), 
        duration: 90,
        courseId: course3._id
      }
    );
    await course3.save();
    console.log('✅ Course 3 created with lectures');

    // Course 4: Python for Data Science
    const course4 = await Course.create({
      name: 'Python for Data Science',
      level: 'Intermediate',
      description: 'Learn Python programming for data analysis and visualization',
      imageUrl: 'https://picsum.photos/seed/python1/400/225',
      lectures: []
    });

    course4.lectures.push(
      { 
        title: 'Python Basics', 
        date: new Date('2025-11-26'), 
        duration: 60,
        courseId: course4._id
      },
      { 
        title: 'NumPy and Pandas', 
        date: new Date('2025-11-28'), 
        duration: 90,
        courseId: course4._id
      }
    );
    await course4.save();
    console.log('✅ Course 4 created with lectures');

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Database seeded successfully!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   • Users created: 3 (1 admin, 2 instructors)`);
    console.log(`   • Courses created: 4`);
    console.log(`   • Total lectures: ${course1.lectures.length + course2.lectures.length + course3.lectures.length + course4.lectures.length}`);
    console.log('\n📧 Login Credentials:');
    console.log('   👤 Admin:');
    console.log('      Email: admin@ideamagix.com');
    console.log('      Password: admin123');
    console.log('\n   👨‍🏫 Instructor 1 (John Doe):');
    console.log('      Email: john@ideamagix.com');
    console.log('      Password: instructor123');
    console.log('\n   👩‍🏫 Instructor 2 (Jane Smith):');
    console.log('      Email: jane@ideamagix.com');
    console.log('      Password: instructor123');
    console.log('='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();