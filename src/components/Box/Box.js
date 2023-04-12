import React from 'react';
import { ContextMenu, MenuItem } from "react-contextmenu";

function MyContextMenu() {
    return (
      <ContextMenu id="myContextMenu"> {/* id должен быть уникальным */}
        <MenuItem onClick={() => alert("Вы выбрали первый пункт меню!")}>
          Первый пункт меню
        </MenuItem>
        <MenuItem onClick={() => alert("Вы выбрали второй пункт меню!")}>
          Второй пункт меню
        </MenuItem>
      </ContextMenu>
    );
  }

function Box() { 
   return (
      <Box>
            <div>
            <p>Кликните правой кнопкой мыши на этом тексте, чтобы открыть контекстное меню:</p>
            <div onContextMenu={(e) => e.preventDefault()} >
               {/* e.preventDefault(), чтобы не открыть стандартное контекстное меню браузера */}
               <span>Some text here</span>
               <MyContextMenu />
            </div>
            </div>
      </Box>
      );
   }

export default Box;
