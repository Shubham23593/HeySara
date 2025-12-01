import { faker } from '@faker-js/faker';

const createMockInstructor = (i) => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: `instructor${i+1}@test.com`,
  password: 'password123', // Simple password for testing
  avatarUrl: faker.image.avatar(),
  mobile: faker.phone.number(),
  bio: faker.lorem.sentence(),
  role: 'instructor',
});

const createMockLecture = (courseId) => ({
    id: faker.string.uuid(),
    title: `${faker.hacker.adjective()} ${faker.hacker.noun()}`.replace(/^\w/, c => c.toUpperCase()),
    date: faker.date.future({ years: 0.2 }),
    duration: faker.helpers.arrayElement([30, 45, 60, 90, 120]),
    courseId: courseId,
});

const createMockCourse = () => {
    const courseId = faker.string.uuid();
    return {
        id: courseId,
        name: `${faker.commerce.productAdjective()} ${faker.commerce.department()}`,
        level: faker.helpers.arrayElement(['Beginner', 'Intermediate', 'Advanced']),
        description: faker.lorem.paragraph(),
        imageUrl: `https://picsum.photos/seed/${faker.string.alphanumeric(5)}/400/225`,
        lectures: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () => createMockLecture(courseId)),
    }
};

export const instructors = Array.from({ length: 10 }, (_, i) => createMockInstructor(i));
export const courses = Array.from({ length: 8 }, createMockCourse);

export const admins = [
    {
        id: 'admin-01',
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin',
    }
];

// Assign some lectures to instructors
courses.forEach(course => {
    course.lectures.forEach((lecture) => {
        if (faker.datatype.boolean(0.7)) {
            const instructor = faker.helpers.arrayElement(instructors);
            // Simple check to avoid assigning two lectures on the same day to the same instructor
            const isAlreadyAssigned = courses.some(c => 
                c.lectures.some(l => 
                    l.instructorId === instructor.id && 
                    new Date(l.date).toDateString() === new Date(lecture.date).toDateString()
                )
            );
            if (!isAlreadyAssigned) {
                lecture.instructorId = instructor.id;
            }
        }
    });
});
