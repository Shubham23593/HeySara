import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

const AssignLecturePage = () => {
  const { instructors, getUnassignedLectures, assignLecture, getAllLectures } = useData();
  
  const [selectedLectureId, setSelectedLectureId] = useState('');
  const [selectedInstructorId, setSelectedInstructorId] = useState('');

  const unassignedLectures = getUnassignedLectures();
  const allLectures = getAllLectures();

  const selectedLecture = useMemo(() => {
    // ✅ CHANGED: Handle both _id and id
    return unassignedLectures.find(l => (l._id || l.id) === selectedLectureId);
  }, [selectedLectureId, unassignedLectures]);

  const handleAssign = async () => {
    if (!selectedLectureId || !selectedInstructorId) {
      toast.error('Please select both a lecture and an instructor.');
      return;
    }

    const lectureDate = new Date(selectedLecture.date);

    // ✅ CHANGED: Handle instructor ID comparison properly
    const hasConflict = allLectures.some(l => {
      const lectInstrId = l.instructorId?._id || l.instructorId;
      return lectInstrId === selectedInstructorId &&
        new Date(l.date).toDateString() === lectureDate.toDateString();
    });

    if (hasConflict) {
      toast.error('Selected instructor already has a lecture assigned on this date.');
      return;
    }

    try {
      // ✅ CHANGED: Use proper IDs
      const lectureId = selectedLecture._id || selectedLecture.id;
      const courseId = selectedLecture.courseId;
      
      await assignLecture(lectureId, courseId, selectedInstructorId);
      toast.success('Lecture assigned successfully!');
      setSelectedLectureId('');
      setSelectedInstructorId('');
    } catch (error) {
      toast.error('Failed to assign lecture. Please try again.');
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Assign Lecture to Instructor</CardTitle>
        <CardDescription>Select an unassigned lecture and an instructor to create an assignment.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="lecture" className="text-sm font-medium">Select Unassigned Lecture</label>
          <select
            id="lecture"
            value={selectedLectureId}
            onChange={(e) => setSelectedLectureId(e.target.value)}
            className="w-full p-2 border rounded-md bg-transparent"
          >
            <option value="">-- Select a Lecture --</option>
            {unassignedLectures.map(lecture => {
              // ✅ CHANGED: Handle both _id and id
              const lectureId = lecture._id || lecture.id;
              return (
                <option key={lectureId} value={lectureId}>
                  {lecture.courseName} - {lecture.title}
                </option>
              );
            })}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="instructor" className="text-sm font-medium">Select Instructor</label>
          <select
            id="instructor"
            value={selectedInstructorId}
            onChange={(e) => setSelectedInstructorId(e.target.value)}
            className="w-full p-2 border rounded-md bg-transparent"
          >
            <option value="">-- Select an Instructor --</option>
            {instructors.map(instructor => {
              // ✅ CHANGED: Handle both _id and id
              const instructorId = instructor._id || instructor.id;
              return (
                <option key={instructorId} value={instructorId}>
                  {instructor.name}
                </option>
              );
            })}
          </select>
        </div>

        {selectedLecture && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold">Assignment Details</h4>
            <p className="text-sm"><strong>Lecture:</strong> {selectedLecture.title}</p>
            <p className="text-sm"><strong>Course:</strong> {selectedLecture.courseName}</p>
            <p className="text-sm"><strong>Date:</strong> {new Date(selectedLecture.date).toLocaleDateString()}</p>
          </div>
        )}

        <Button onClick={handleAssign} className="w-full" disabled={!selectedLectureId || !selectedInstructorId}>
          Assign Lecture
        </Button>
      </CardContent>
    </Card>
  );
};

export default AssignLecturePage;