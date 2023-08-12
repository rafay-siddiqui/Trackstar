import { useState, useEffect, useRef } from 'react'

function DemoProfile({ userProfile, }) {
  const [showLogout, setShowLogout] = useState(false)
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })
  const profileRef = useRef(null)
  const [demoLogout, setDemoLogout] = useState(false)
  const popupRef = useRef(null)

  const handleClickOutside = (event) => {
    if (
      popupRef.current &&
      !popupRef.current.contains(event.target) &&
      profileRef.current &&
      !profileRef.current.contains(event.target)
    ) {
      setShowLogout(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleClickOutside);
    return () => {
      document.removeEventListener('mouseup', handleClickOutside);
    };
  }, []);

  const togglePopup = () => {
    if (profileRef.current) {
      const profileRect = profileRef.current.getBoundingClientRect();
      setPopupPosition({
        top: profileRect.top,
        left: profileRect.left,
        width: profileRect.width,
        height: profileRect.height*2,
      });
    }
    setShowLogout(!showLogout);
  }

  useEffect(() => {
    showLogout === false && setDemoLogout(false);
  }, [showLogout])

  return (
    <>
      <div className='user-profile' id={showLogout ? 'user-profile-menu' : ''} onClick={togglePopup} ref={profileRef} >
        {userProfile && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h2 style={{ margin: '0px', marginRight: '10px', userSelect: 'none' }}>{userProfile.name}</h2>
            <div
              className='profile-picture'
              style={{ backgroundImage: `url(${userProfile.picture})` }}
            />
          </ div>
        )}
        {!userProfile && <LoginButton />}
      </div>
      {showLogout && (
        <div ref={popupRef} className="logout-popup" style={popupPosition}>
          <button onClick={() => { setDemoLogout(true) }}>Log Out</button>
          <br />
          {demoLogout && <span style={{ margin: '0px', fontSize: 'xx-small' }}>Currently Demo Profily Only</span>}
        </div>
      )}
    </>
  );
}

function LoginButton() {
  return (
    <button>Log In</button>
  )
}

export default DemoProfile;