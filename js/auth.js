let currentUser = null;
let currentProfile = null;


// LOGIN
document.addEventListener("DOMContentLoaded", () => {

    const loginForm =
        document.getElementById("loginForm");

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            loginUser
        );

    }

});


// LOGIN FUNCTION
async function loginUser(event) {

    event.preventDefault();


    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;


    const message =
        document.getElementById("loginMessage");


    message.textContent = "Signing in...";
    message.className = "form-message";


    try {

        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });


        if (error) {
            throw error;
        }


        currentUser = data.user;


        const { data: profile, error: profileError } =
            await supabaseClient
                .from("profiles")
                .select("id, full_name, role")
                .eq("id", currentUser.id)
                .single();


        if (profileError) {
            throw profileError;
        }


        currentProfile = profile;


        localStorage.setItem(
            "userProfile",
            JSON.stringify(profile)
        );


        message.textContent =
            "Login successful. Redirecting...";

        message.className =
            "form-message success";


        setTimeout(() => {

            window.location.href = "index.html";

        }, 500);


    } catch (error) {

        console.error(error);


        message.textContent =
            error.message ||
            "Login failed. Please check your credentials.";

        message.className =
            "form-message error";

    }

}


// CHECK SESSION
async function getSessionUser() {

    const { data, error } =
        await supabaseClient.auth.getSession();


    if (error) {
        console.error(error);
        return null;
    }


    currentUser =
        data.session?.user || null;


    return currentUser;
}


// LOGOUT
async function logoutUser() {

    await supabaseClient.auth.signOut();

    localStorage.removeItem("userProfile");

    currentUser = null;
    currentProfile = null;

    window.location.href = "login.html";
}


window.logoutUser = logoutUser;