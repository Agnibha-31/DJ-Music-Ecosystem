import bcrypt from 'bcryptjs';

const password = 'Admin@12345';
const saltRounds = 12;

bcrypt.hash(password, saltRounds).then(hash => {
    console.log('HASH:' + hash);
}).catch(err => {
    console.error('Bcrypt error:', err);
});
