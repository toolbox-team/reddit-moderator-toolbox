import {createContext} from 'react';

/** Context for whether you're rendering inside a <Window>, and if so, where. */
export const WindowPlacementContext = createContext<null | 'header' | 'content' | 'footer'>(null);
