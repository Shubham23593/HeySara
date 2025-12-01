import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import Modal from '../ui/Modal';
import { useData } from '../../contexts/DataContext';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

const AssignInstructorModal = ({ isOpen, onClose, course }) => {
  const { instructors, getUnassignedLectures, assignLecture, getAllLectures } = useData();
  
  const [selectedLectureId, setSelectedLectureId] = useState('');
  const [selectedInstructorId, setSelectedInstructorId] = useState('');
  const [unassignedLectures, setUnassignedLectures] = useState([]);

  useEffect(() => {
    if (course && isOpen) {
      // ✅ CHANGED: Use proper course ID
      const courseId = course._id || course.id;
      setUnassignedLectures(getUnassignedLectures(courseId));
    }
  }, [course, getUnassignedLectures, isOpen]);

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
    const allLectures = getAllLectures();

    // ✅ CHANGED: Proper instructor ID comparison
    const hasConflict = allLectures.some(l => {
      const lectInstrId = l.instructorId?._id || l.instructorId;
      return lectInstrId === selectedInstructorId &&
        new Date(l.date).toDateString() === lectureDate.toDateString();
    });

    if (hasConflict) {
      toast.error('This instructor is already assigned another lecture on this date.');
      return;
    }

    try {
      // ✅ CHANGED: Use proper IDs
      const lectureId = selectedLecture._id || selectedLecture.id;
      const courseId = selectedLecture.courseId || course._id || course.id;
      
      await assignLecture(lectureId, courseId, selectedInstructorId);
      toast.success('Lecture assigned successfully!');
      
      // ✅ CHANGED: Reset selections and close modal
      setSelectedLectureId('');
      setSelectedInstructorId('');
      onClose();
    } catch (error) {
      toast.error('Failed to assign lecture. Please try again.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Instructor to ${course?.name || 'Course'}`}
      description="Select an unassigned batch and an instructor."
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="lecture" className="text-sm font-medium">Select Unassigned Batch</label>
          <select
            id="lecture"
            value={selectedLectureId}
            onChange={(e) => setSelectedLectureId(e.target.value)}
            className="w-full p-2 border rounded-md bg-transparent"
          >
            <option value="">-- Select a Batch --</option>
            {unassignedLectures.map(lecture => {
              // ✅ CHANGED: Handle both _id and id
              const lectureId = lecture._id || lecture.id;
              return (
                <option key={lectureId} value={lectureId}>
                  {lecture.title} ({new Date(lecture.date).toLocaleDateString()})
                </option>
              );
            })}
          </select>
          {unassignedLectures.length === 0 && (
            <p className="text-xs text-muted-foreground">No unassigned batches for this course.</p>
          )}
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
            <p className="text-sm"><strong>Date:</strong> {new Date(selectedLecture.date).toLocaleDateString()}</p>
          </div>
        )}

        <Button 
          onClick={handleAssign} 
          className="w-full" 
          disabled={!selectedLectureId || !selectedInstructorId}
        >
          Assign Instructor
        </Button>
      </div>
    </Modal>
  );
};

AssignInstructorModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  course: PropTypes.object.isRequired,
};

export default AssignInstructorModal;