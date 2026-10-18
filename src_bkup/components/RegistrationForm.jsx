import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./RegistrationForm.css";


const RegistrationForm = () => {

    const navigate = useNavigate();


    const [formData, setFormData] = useState({
        companyName: "",
        companyEmail: "",
        phoneNumber: "",
        companyAddress: "",
        industry: "",
        taxId: "",
        registrationNumber: "",
        contactFirstName: "",
        contactLastName: "",
        contactEmail: "",
        contactPhone: "",
        password: "",
        confirmPassword: ""
    });


    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");



    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

    };



    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");
        setLoading(true);



        if (formData.password !== formData.confirmPassword) {

            setError("Passwords do not match");
            setLoading(false);
            return;

        }



        if (formData.password.length < 8) {

            setError("Password must be at least 8 characters");
            setLoading(false);
            return;

        }



        try {


            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/register`,
                {

                    companyName: formData.companyName,
                    companyEmail: formData.companyEmail,
                    phoneNumber: formData.phoneNumber,
                    companyAddress: formData.companyAddress,
                    industry: formData.industry,
                    taxId: formData.taxId,
                    registrationNumber: formData.registrationNumber,

                    contactFirstName: formData.contactFirstName,
                    contactLastName: formData.contactLastName,
                    contactEmail: formData.contactEmail,
                    contactPhone: formData.contactPhone,

                    password: formData.password

                }
            );



            if (response.status === 201) {

                setSuccess(
                    "Registration submitted successfully! An admin will review your application."
                );


                setTimeout(() => {

                    navigate("/");

                }, 3000);

            }


       } catch (err) {
  const errorMessage =
    Object.values(err.response?.data?.details || {})[0] ||
    err.response?.data?.error ||
    "Registration failed. Please try again.";

  setError(errorMessage);
} finally {
  setLoading(false);
}

    };


    return (

        <div className="registration-container">

            <div className="registration-card">


                <h2>
                    Company Registration
                </h2>


                <p className="subtitle">
                    Join Techstack Banking Platform
                </p>



                {error && (
                    <div className="alert alert-error">
                        {error}
                    </div>
                )}



                {success && (
                    <div className="alert alert-success">
                        {success}
                    </div>
                )}





                <form onSubmit={handleSubmit}>


                    <div className="form-section">

                        <h3>
                            Company Information
                        </h3>


                        <div className="form-grid">


                            <div className="form-group">
                                <label>
                                    Company Name *
                                </label>

                                <input
                                    type="text"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    required
                                />

                            </div>



                            <div className="form-group">

                                <label>
                                    Company Email *
                                </label>

                                <input
                                    type="email"
                                    name="companyEmail"
                                    value={formData.companyEmail}
                                    onChange={handleChange}
                                    required
                                />

                            </div>




                            <div className="form-group">

                                <label>
                                    Phone Number
                                </label>

                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                />

                            </div>





                            <div className="form-group">

                                <label>
                                    Industry
                                </label>

                                <select
                                    name="industry"
                                    value={formData.industry}
                                    onChange={handleChange}
                                >

                                    <option value="">
                                        Select Industry
                                    </option>

                                    <option value="technology">
                                        Technology
                                    </option>

                                    <option value="finance">
                                        Finance
                                    </option>

                                    <option value="healthcare">
                                        Healthcare
                                    </option>

                                    <option value="retail">
                                        Retail
                                    </option>

                                    <option value="manufacturing">
                                        Manufacturing
                                    </option>

                                    <option value="other">
                                        Other
                                    </option>

                                </select>

                            </div>





                            <div className="form-group full-width">

                                <label>
                                    Company Address
                                </label>


                                <input
                                    type="text"
                                    name="companyAddress"
                                    value={formData.companyAddress}
                                    onChange={handleChange}
                                />

                            </div>





                            <div className="form-group">

                                <label>
                                    Tax ID
                                </label>

                                <input
                                    type="text"
                                    name="taxId"
                                    value={formData.taxId}
                                    onChange={handleChange}
                                />

                            </div>





                            <div className="form-group">

                                <label>
                                    Registration Number
                                </label>

                                <input
                                    type="text"
                                    name="registrationNumber"
                                    value={formData.registrationNumber}
                                    onChange={handleChange}
                                />

                            </div>


                        </div>

                    </div>







                    <div className="form-section">

                        <h3>
                            Contact Person
                        </h3>



                        <div className="form-grid">


                            <div className="form-group">

                                <label>
                                    First Name *
                                </label>

                                <input
                                    type="text"
                                    name="contactFirstName"
                                    value={formData.contactFirstName}
                                    onChange={handleChange}
                                    required
                                />

                            </div>




                            <div className="form-group">

                                <label>
                                    Last Name *
                                </label>

                                <input
                                    type="text"
                                    name="contactLastName"
                                    value={formData.contactLastName}
                                    onChange={handleChange}
                                    required
                                />

                            </div>





                            <div className="form-group">

                                <label>
                                    Contact Email *
                                </label>

                                <input
                                    type="email"
                                    name="contactEmail"
                                    value={formData.contactEmail}
                                    onChange={handleChange}
                                    required
                                />

                            </div>





                            <div className="form-group">

                                <label>
                                    Contact Phone
                                </label>

                                <input
                                    type="tel"
                                    name="contactPhone"
                                    value={formData.contactPhone}
                                    onChange={handleChange}
                                />

                            </div>


                        </div>


                    </div>







                    <div className="form-section">


                        <h3>
                            Security
                        </h3>


                        <div className="form-grid">


                            <div className="form-group">

                                <label>
                                    Password *
                                </label>

                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />

                            </div>





                            <div className="form-group">

                                <label>
                                    Confirm Password *
                                </label>

                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />

                            </div>


                        </div>


                    </div>





                    <button
                        type="submit"
                        className="btn-submit"
                        disabled={loading}
                    >

                        {loading ? "Submitting..." : "Register Company"}

                    </button>



                </form>




                <p className="login-link">

                    Already have an account?{" "}

                    <Link to="/">
                        Login here
                    </Link>

                </p>



            </div>

        </div>

    );

};


export default RegistrationForm;