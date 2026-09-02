import { Form, Link, redirect, useActionData, useNavigate, useNavigation } from "react-router";
import { authClient } from "../../lib/auth";
import styles from "./landing.module.css"
import { useEffect, useRef, useState } from "react"
import { useMusic } from "../../lib/MusicProvider";

export async function loginLoader() {
  const { data: session } = await authClient.getSession();
  if (session) {
    throw redirect("/dashboard");
  }
  return null;
}

export async function loginAction({ request }: { request: Request }) {
  // login form submit thing
  const formData = await request.formData();
  const name = formData.get("username") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const register = formData.get("register") as string;

  let redir = false;
  let err = "An error occurred. Please try again.";

  if (register === "register") {
    await authClient.signUp.email(
      { name, email, password },
      {
        onSuccess: (ctx) => { redir = true; }, // redirect
        onError: (ctx) => { console.log(ctx.error); err = ctx.error.message; },
      }
    )
  } else {
    await authClient.signIn.email(
      { email, password },
      {
        onSuccess: (ctx) => { redir = true; }, // redirect
        onError: (ctx) => { console.log(ctx.error); err = ctx.error.message; },
      },
    )
  }

  if (redir) {
    return redirect("/dashboard");
  }

  return { error: err };
}

export default function Landing() {
  const [showPassword, setShowPassword] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [inLogin, setInLogin] = useState(window.location.pathname === "/login");
  const [inRegister, setInRegister] = useState(false);

  const navigate = useNavigate();
  const navigation = useNavigation();
  const isNavigating = Boolean(navigation.location);
  const actionData = useActionData<{ error?: string }>();
  const { toggleMusic, isPlaying } = useMusic();

  // landing page start button action
  const startClick = () => {
    setClicked(true);
    setTimeout(() => {
      navigate("/login");
    }, 1000);
    setTimeout(() => {
      setInLogin(true);
      setInRegister(false);
      setClicked(false);
      
    }, 1700);
  }

  const googleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: import.meta.env.VITE_FRONTEND_URL + "/login"
    });
  }

  useEffect(() => {
    window.addEventListener('popstate', () => {
      setInLogin(window.location.pathname === "/login");
      setInRegister(false);
    });
  }, []);


  return <div>
    
    <img src="/learnternBackground.png" className={styles.background}></img>
    <div className={(!clicked && !isNavigating) ? styles.darkness : `${styles.darkness} ${styles.panIn}`}></div>
    <div
      onClick={toggleMusic}
      className={
        isPlaying
          ? styles.soundButton
          : `${styles.soundButton} ${styles.muted}`
      }
    />
    <div className={styles.main}>
      <div className={styles.titleWrapper}>
        <div className={(!clicked && !isNavigating) ? styles.candleLight : `${styles.candleLight} ${styles.out}`}>
          <div className={(!clicked && !isNavigating) ? styles.candle : `${styles.candle} ${styles.blowOut}`}></div>
        </div>
        <div className={styles.title}>earntern</div>
      </div>
      <div className={styles.bio}> Illuminate your learning. </div>

      {/* LANDING PAGE STUFF */}

      <div className={styles.startButton} style={{display: !inLogin ? "flex" : "none"}} onClick={startClick}></div> 
     
      {/* LOGIN STUFF */}
      
      <div className={styles.loginCard} style={{ display: inLogin ? "flex" : "none" }}>
        <h1 className={styles.cardTitle}>{inRegister ? "Register" : "Welcome back!"}</h1>
        <Form method="post"> 
          <input type="hidden" name="register" value={inRegister ? "register" : ""} />
          <div className={styles.inputGroup} style={{ display: inRegister ? "block" : "none" }}>
            <label htmlFor="email">NAME</label>
            <input name="username" id="username" type="text" placeholder="Enter your name" required={inRegister} />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="email">EMAIL</label>
            <input name="email" id="email" type="email" placeholder="Enter your email" autoComplete="email" required />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">PASSWORD</label>
            <div className={styles.passwordWrapper}>
              <input
                name="password" id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" autoComplete="current-password" required />
              <button type="button" className={styles.showPassword} onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>
          </div>

          <div className={styles.forgot} style={{display: inRegister ? "none" : "flex"}}>
            <a href="/forgot-password">Forgot password?</a>
          </div>

          <button className={styles.loginButton + " " + styles.loginMain} type="submit">
            <span>{isNavigating ? "loading..." : inRegister ? "REGISTER" : "LOGIN"}</span>
          </button>
        </Form>

        <div className={styles.divider}><span/><p>OR</p><span/></div>

        <div className={styles.loginOptions}>
          <button className={styles.loginButton} type="button" onClick={googleSignIn}>
            <img src='google.svg' className={styles.google}></img>
            <span>CONTINUE WITH GOOGLE</span>
          </button>
          <button className={styles.loginButton}  type="button" onClick={() => setInRegister(!inRegister)}>
            <span>{inRegister ? "USE EXISTING ACCOUNT" : "REGISTER NEW ACCOUNT"}</span>
          </button>
        </div>
        {actionData?.error && (
          <p className={styles.feedbackText} style={{ display: actionData?.error ? "block" : "none" }} >
            {actionData.error}
          </p>
        )}

      </div>

    </div>

  </div>
}