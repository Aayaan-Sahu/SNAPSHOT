import { GoogleSignin } from "@react-native-google-signin/google-signin";

export function initGoogleSignin() {
    GoogleSignin.configure({
        iosClientId: "591329119418-q974oq4g60l9tojtacma5ukg1gajbmv7.apps.googleusercontent.com",
        scopes: ["email", "profile"],
    });
}