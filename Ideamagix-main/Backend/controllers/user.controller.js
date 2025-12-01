import User from '../models/User.js';

// @desc    Get all instructors
// @route   GET /api/users/instructors
// @access  Private/Admin
export const getInstructors = async (req, res) => {
  try {
    const instructors = await User.find({ role: 'instructor' });
    res.json(instructors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get instructor by ID
// @route   GET /api/users/instructors/:id
// @access  Private
export const getInstructorById = async (req, res) => {
  try {
    const instructor = await User.findById(req.params.id);
    if (!instructor || instructor.role !== 'instructor') {
      return res.status(404).json({ message: 'Instructor not found' });
    }
    res.json(instructor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.mobile = req.body.mobile || user.mobile;
    user.bio = req.body.bio || user.bio;
    user.avatarUrl = req.body.avatarUrl || user.avatarUrl;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      mobile: updatedUser.mobile,
      bio: updatedUser.bio,
      avatarUrl: updatedUser.avatarUrl
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();
    res.json({ message: 'User removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};