import React from "react";


export function Popup(props:any) {

   return (
      <div>
        {props.trigger?
          <div hidden className='popup'>
            <div className='popup-inner'>     
                <button className='close-btn' id="close-popup" >&#10006;</button>
                {props.children}
            </div>
          </div>:""} 
      </div>
    );
    
  }