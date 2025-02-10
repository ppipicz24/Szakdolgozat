import { getDatabase, ref, set } from "firebase/database";

export function writeUserData(userId, userName, email, phoneNumber, admin) {
    const db = getDatabase();
    set(ref(db, 'users/' + userId), {
        username: name,
        admin: admin,
        email: email,
        phoneNumber: phoneNumber
    });
}

