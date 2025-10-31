import { useContext } from "react";
import { CollabSessionContext } from "./CollabSessionContext";

export const useCollabSession = () => useContext(CollabSessionContext);
