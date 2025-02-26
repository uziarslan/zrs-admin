import React, { useEffect, useState } from "react";

export default function Flash({ message }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 3000);
    return () => {
      clearTimeout(timer);
      setVisible(true);
    };
  }, [message]);

  return (
    <>
      <div
        className={`${
          message.success
            ? "verfication-notification"
            : "verfication-notification-error"
        } ${message.success && visible ? "show" : ""}
          ${message.error && visible ? "show" : ""}
        `}
      >
        <div className="check-icon">
          {message.error && (
            <div className="check-icon">
              <svg
                width="35"
                height="35"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 18L18 6M6 6L18 18"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
          {message.success && (
            <svg
              width="35"
              height="35"
              viewBox="0 0 35 35"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="35" height="35" fill="url(#pattern0_1284_11532)" />
              <defs>
                <pattern
                  id="pattern0_1284_11532"
                  patternContentUnits="objectBoundingBox"
                  width="1"
                  height="1"
                >
                  <use href="#image0_1284_11532" transform="scale(0.0111111)" />
                </pattern>
                <image
                  id="image0_1284_11532"
                  width="90"
                  height="90"
                  href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFoAAABaCAYAAAA4qEECAAAACXBIWXMAAAsTAAALEwEAmpwYAAAEuUlEQVR4nO2dW6hVRRiAV3lLKp+C1ISI6DEysScrTUozCovoqqGpaaDgjfSloKcSQRDB3qS33jpZSkrRSw8FoSe3xo4ezILU8njtZZ9tHr/4Of+G3eLsW2tm1r/Wmg8OyNnutWa+PXvWzD//zEmSSCQSiUQikUgkEon0BzAJeARYC+wGDgIngdPAZaAJjAIX9HfHgMPALmAl8DAwpc/bVQtgDrAFOARcIzt/A58C64B7kioDTAfeAL4GxvDHTeAb4EVgclIVgDuBHcCfhOcs8C5wR1JWgCnAO8Al8kc+5LdL18KBhcBP2ONn4PGk6AC3Afu1n7TKmI5Ypg5Yt2n6vvP6M/A1nAA8AAxTHIalzANI/nKCa3zo3+x/C/Kko2FaaC4CC/r4lk4kWTgXUvILQIPiMgq81qFuU4Evurz3bCjJ6z2PiUMhdVg9QEtu8UEIyS+XRHKLf4DnB5Asr0/zLXmxfuXKRhN4TkMD3TgqH0aI0UURH3z9IM+aVzV4lWtLlmHOccpJU1qz1nN+h2+s/5asBZDJSFlb8tOpukp0MWxL1hs/ZnzGl7klp+p7K/Bd6JY8GahREcktgAf1wehfst5QonCl7y7SyOvAqiQEEsvVqWplWrIALNEP4/cgwSNgJ9WV3GKtb8kyQzpHtSULv3lt1brGV7U+udHh/a/4FC0LqVVpyUt7RCGP+kwJKEPQqJGxJbcQF7N8iE7PjKosucUGH6J7RbCqJlk47CNN6wrV7pMnQqKWk1yKlly4otLw0JLbmetStOSwFZGmp5bczhqXoiWrs2g0A0gW9rgU/Tnl6y6WOVqtP+RSdJFCoo2AkoVhl6LPZCzMt5pUuEkTx8si2W3STMaw6CeyOpFaNDhAOSQL11yKlgfL/+XeDstCB0ogWbhuQfRYp/0kuJOdp2Rh1ErX8USX62aVnbdkYcTKw/AX4C4Psi1IFn61NLyrOZbdr+QQaWo/Wpuw1IGZXe5xC/CRoRlfvwxZnILXM8q2Jtltlr/uYiVn2U2DkknnUVsLk9YG7LMt9clp5lkP/Nf7bNlWWzLqxF3gXyvTbe+Gz5b9UI9yPZNjEry7B2FbhTZ7Kmytm2zDkoWNPkTPBm54KnC9WzfiYfnJBTcGLfMglfvKY8Hr/RbcgGThiBfJgVLC6r1kG5EsvO47yVGOYshFNnYky97v6d5EB0xCrwF3p+77rKEtdtu8Sm472CTEmRt/Ae9Jhj3wsaG8vxHgdu+iVfZ2qsvmIJLb1v1OUD1OBT+BDHi0pNvfOiF1XRhUcpvsfVSHvblIbtui7DNPwwo/5HKMT0r2/cBVyssV4L7EAsAiIxMJ10iI9qnEEsByj0GnPJBx+0uJRYC3DE0ssiANZl1iGTkep+DdyKgcW5QUAT3652pBH3yLkiIhyY3A9xSHYzKCSoqIjrP3GZ9BStn25j5Odjhdr2GPWq+TGwsH44GorRpmzJsRXWwu17HG7UgsVyv5Rw6CJcb9PjAjqQqML4ut0IOgfE505NpHZI0v2FlIVgFm6Uaiz/QvU2Tlsl5ro7eUgKLDePrZPNmRqodfD0kOsp6meEnjD03992l9bUj/75v6XrdpWpFIJBKJRCKRSCSSlJh/ATfeoWqhunZkAAAAAElFTkSuQmCC"
                />
              </defs>
            </svg>
          )}
        </div>
        <div className="notification-text">
          {message.success || message.error}
        </div>
      </div>
    </>
  );
}
