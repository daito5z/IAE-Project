const db = require('../db');

const userModel = {
    getAdminUserByUsername: (username) => {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM admin_users WHERE username = ?', [username], (err, results) => {
                if (err) {
                    return reject(err);
                }
                if (results.length === 0) {
                    return resolve(null);
                }
                resolve(results[0]);
            });
        });
    },
    // Add more methods for managing admin register, if needed
    getAllUsers: async () => {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM register', (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(results);
            });
        });
    },
    deleteUser: async (userId) => {
        return new Promise((resolve, reject) => {
            db.query('SET FOREIGN_KEY_CHECKS = 0', (error) => {
                if (error) {
                    reject(error);
                    return;
                }
                db.query('DELETE FROM register WHERE id = ?', [userId], (deleteError, results) => {
                    if (deleteError) {
                        db.query('SET FOREIGN_KEY_CHECKS = 1', (enableError) => {
                            if (enableError) {
                                reject(enableError);
                                return;
                            }
                            reject(deleteError);
                        });
                        return;
                    }
                    db.query('SET FOREIGN_KEY_CHECKS = 1', (enableError) => {
                        if (enableError) {
                            reject(enableError);
                            return;
                        }
                        resolve();
                    });
                });
            });
        });
    },
    
    updateUser: async (userId, userDetails) => {
        const { name, email, phno, password } = userDetails;
    
        // Construct the SQL query based on provided fields
        let updateFields = [];
        let queryParams = [];
    
        if (name) {
            updateFields.push('name = ?');
            queryParams.push(name);
        }
        if (email) {
            updateFields.push('email = ?');
            queryParams.push(email);
        }
        if (phno) {
            updateFields.push('phno = ?');
            queryParams.push(phno);
        }
        if (password) {
            updateFields.push('password = ?');
            queryParams.push(password);
        }
    
        // If no fields are provided for update, return with a message
        if (updateFields.length === 0) {
            return Promise.reject(new Error('No fields provided for update'));
        }
    
        // Construct the final SQL query
        let sql = `UPDATE register SET ${updateFields.join(', ')} WHERE id = ?`;
        queryParams.push(userId);
    
        return new Promise((resolve, reject) => {
            db.query(sql, queryParams, (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    }
    

}

module.exports = userModel;
