import React from 'react'
import './Login.css'
import Signup from './Signup'


export default function Login() {
  return (
    <div>
      <div className="container">
        <div className="drop">
            <div className="context">
                <h2>Sign In</h2>
                <form>
                    <div className="input">
                        <input type="text" name='username' placeholder='Username' />
                    </div>
                    <div className="input">
                        <input type="password" name='password' placeholder='Password' />
                    </div>
                    <div className="input">
                        <input type="submit" value='Login' href="#" />
                    </div>
                </form>
            </div>
        </div>
        <a href="#" className="btn">Forget Password</a>
        <a href="./Signup.jsx" className="btn signup">Sign Up</a>
      </div>
    </div>
  )
}
