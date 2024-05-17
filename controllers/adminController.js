
const userModel = require('../models/userModel');

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if admin user exists
        const adminUser = await userModel.getAdminUserByUsername(username);
        if (!adminUser) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Compare passwords
        if (password !== adminUser.password) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Authentication successful
        req.session.adminUserId = adminUser.id;
        
        // Redirect to dashboard page
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error('Error logging in admin:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.dashboard = async (req, res) => {
    try {
        // Fetch list of registered users
        const users = await userModel.getAllUsers();
        res.render('admin-dashboard', { users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteUser = async (req, res) => {
    const userId = req.params.id;

    try {
        await userModel.deleteUser(userId);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateUserDetails = async (req, res) => {
    const userId = req.params.id;
    const userDetails = req.body;

    try {
        await userModel.updateUser(userId, userDetails);
        res.status(200).json({ message: 'User details updated successfully' });
    } catch (error) {
        console.error('Error updating user details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.logout = async(req,res)=>{
    res.cookie("userSave", "logout", {
        expires: new Date(Date.now() - 1000), // set expiry to past time
        httpOnly: true,
      });
      res.status(200).redirect("/");
}
