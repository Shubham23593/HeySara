import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '../ui/Button';
import { PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AddBatchForm = ({ courseId, onAddBatch }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [duration, setDuration] = useState('60');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !date) {
      toast.error('Please provide a title and date.');
      return;
    }
    onAddBatch(courseId, { title, date: new Date(date), duration: parseInt(duration) });
    setTitle('');
    setDate('');
    setDuration('60');
    toast.success('Batch added successfully!');
  };

  return (
    <form onSubmit={handleSubmit} className="grid sm:grid-cols-3 md:grid-cols-4 gap-4 items-end">
      <div className="space-y-1 sm:col-span-3 md:col-span-1">
        <label htmlFor="batch-title" className="text-xs font-medium">Batch/Lecture Title</label>
        <input
          id="batch-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded-md bg-transparent"
          placeholder="e.g., Introduction"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="batch-date" className="text-xs font-medium">Date</label>
        <input
          id="batch-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full p-2 border rounded-md bg-transparent"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="batch-duration" className="text-xs font-medium">Duration (mins)</label>
        <select
          id="batch-duration"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="w-full p-2 border rounded-md bg-transparent"
        >
          <option value="30">30</option>
          <option value="45">45</option>
          <option value="60">60</option>
          <option value="90">90</option>
          <option value="120">120</option>
        </select>
      </div>
      <Button type="submit" className="w-full">
        <PlusCircle className="mr-2 h-4 w-4" /> Add Batch
      </Button>
    </form>
  );
};

AddBatchForm.propTypes = {
  courseId: PropTypes.string.isRequired,
  onAddBatch: PropTypes.func.isRequired,
};

export default AddBatchForm;
