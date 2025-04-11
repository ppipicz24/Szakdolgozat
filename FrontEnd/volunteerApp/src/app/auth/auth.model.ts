export interface AuthData {
  id: string;
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: string;
  googleCalendar:{
    connected: boolean;
    access_token: string;
    refresh_token: string;
  }
}
