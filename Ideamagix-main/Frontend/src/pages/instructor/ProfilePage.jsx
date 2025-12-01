import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import ImageUpload from '../../components/ui/ImageUpload.jsx';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    bio: '',
    avatarUrl: null,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || '',
        bio: user.bio || '',
        avatarUrl: user.avatarUrl || null,
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };
  
  const handleImageUpload = (imageUrl) => {
    setFormData(prev => ({ ...prev, avatarUrl: imageUrl }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error('Name and Email are required.');
      return;
    }
    updateProfile(formData);
  };

  if (!user) {
    return <div>Loading profile...</div>;
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
        <CardDescription>Update your personal information and profile picture.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-2">
            <h3 className="font-semibold">Profile Picture</h3>
            <ImageUpload 
              onImageUpload={handleImageUpload}
              initialImage={formData.avatarUrl}
            />
          </div>
          <div className="md:col-span-2 space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Full Name</label>
              <input id="name" value={formData.name} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-transparent" required />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email Address</label>
              <input id="email" type="email" value={formData.email} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-transparent" required />
            </div>
            <div className="space-y-2">
              <label htmlFor="mobile" className="text-sm font-medium">Mobile Number</label>
              <input id="mobile" type="tel" value={formData.mobile} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-transparent" placeholder="e.g., +1 234 567 890" />
            </div>
            <div className="space-y-2">
              <label htmlFor="bio" className="text-sm font-medium">Short Bio</label>
              <textarea id="bio" value={formData.bio} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-transparent min-h-[80px]" placeholder="Tell us a little about yourself..."/>
            </div>
            <div className="flex justify-end">
              <Button type="submit">Save Changes</Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfilePage;
