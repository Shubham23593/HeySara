import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import ImageUpload from '../ui/ImageUpload';

const CourseForm = ({ onSubmit, initialData = null, title, description, buttonText }) => {
  const [courseName, setCourseName] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [courseDescription, setCourseDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    if (initialData) {
      setCourseName(initialData.name);
      setLevel(initialData.level);
      setCourseDescription(initialData.description);
      setImageUrl(initialData.imageUrl);
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!courseName || !courseDescription || !imageUrl) {
      alert('Please fill all fields and upload an image.');
      return;
    }
    onSubmit({ name: courseName, level, description: courseDescription, imageUrl });
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="courseName" className="text-sm font-medium">Course Name</label>
            <input
              id="courseName"
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              className="w-full p-2 border rounded-md bg-transparent"
              placeholder="e.g., Advanced React Patterns"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="level" className="text-sm font-medium">Level</label>
            <select
              id="level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full p-2 border rounded-md bg-transparent"
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <textarea
              id="description"
              value={courseDescription}
              onChange={(e) => setCourseDescription(e.target.value)}
              className="w-full p-2 border rounded-md bg-transparent min-h-[100px]"
              placeholder="Describe the course content..."
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Course Image</label>
            <ImageUpload 
              onImageUpload={setImageUrl}
              initialImage={imageUrl}
            />
          </div>
          <Button type="submit" className="w-full">{buttonText}</Button>
        </form>
      </CardContent>
    </Card>
  );
};

CourseForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  buttonText: PropTypes.string.isRequired,
};

export default CourseForm;
