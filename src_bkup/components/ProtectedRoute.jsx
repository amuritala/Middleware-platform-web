import React from "react";
import { Navigate } from "react-router-dom";


export default function ProtectedRoute({
    children,
    requiredRole,
    userRole
}){


    console.log(
        "ProtectedRoute",
        requiredRole,
        userRole
    );


    if(!userRole){

        return <h2>Checking permissions...</h2>;

    }


    if(userRole !== requiredRole){

        return (
            <Navigate
                to="/"
                replace
            />
        );

    }


    return children;

}