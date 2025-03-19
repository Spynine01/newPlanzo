import React from 'react'
import './Signup.css'

export default function Signup() {
  return (
    <div>
      <div className="container">
        <div className="drop">
            <div className="context">
                <h2>Sign Up</h2>
                <form>
                    <div className="input">
                        <input type="text" name='username' placeholder='Username' />
                    </div>
                    <div className="input">
                        <input type="Email" name='Email' placeholder='Email' />
                    </div>
                    <div className="input">
                        <input type="password" name='password' placeholder='Password' />
                    </div>
                    <div className="input">
                        <input type="password" name='confirmpassword' placeholder='Confirm Password' />
                    </div>
                    <div className="input">
                        <input type="submit" value='Sign Up' href="#" />
                    </div>
                </form>
            </div>
        </div>
        <a href='./Login.jsx' className="btn signup">Login</a>
      </div>
    </div>
  )
}
