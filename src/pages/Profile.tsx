import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAppSelector } from "@/hooks/useAuth";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";


export default function Profile() {
  const state = useAppSelector((state) => state.auth);
  console.log("State in profile ", state);
  const candidate = state.user!;
  const [editable, setEditable] = useState(true);
  
  const [formData, setFormData] = useState({
    first_name: candidate.first_name,
    last_name: candidate.last_name,
    email: candidate.email,
    phone: candidate.phone,
    date_of_birth: candidate.date_of_birth,
    gender: candidate.gender,
    address: candidate.address,
    profile_photo_url: candidate.profile_photo_url,
    portfolio_url: candidate.portfolio_url,
    profile_photo_file: null as File | null,
    resume_url: candidate.resume_url,
    resume_file: null as File | null,
  });

  const {
  control,
  } = useForm()

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, files } = e.target as HTMLInputElement;

    // Handle file fields
    if (files && files.length > 0) {
      if (name === "profile_photo") {
        setFormData((prev) => ({
          ...prev,
          profile_photo_file: files[0],
          profile_photo_url: URL.createObjectURL(files[0]), // for preview
        }));
      } else if (name === "resume") {
        setFormData((prev) => ({
          ...prev,
          resume_file: files[0],
        }));
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = new FormData();
    payload.append("first_name", formData.first_name);
    payload.append("last_name", formData.last_name);
    payload.append("email", formData.email);
    payload.append("phone", formData.phone);
    payload.append("date_of_birth", formData.date_of_birth);
    payload.append("gender", formData.gender);
    payload.append("address", formData.address);

    if (formData.profile_photo_file) {
      payload.append("profile_photo", formData.profile_photo_file);
    }

    if (formData.resume_file) {
      payload.append("resume", formData.resume_file);
    }

    // 👇 Replace this with your actual API call
    try {
      // await axios.post("/api/profile/update", payload);
      console.log("Form submitted successfully");
      setEditable(false);
    } catch (err) {
      console.error("Error submitting form", err);
    }
  };

  return (
    <>
      {editable ? (
        <form
          onSubmit={handleSubmit}
          className="relative max-w-3xl w-full mx-auto p-6 bg-white rounded-xl shadow-md space-y-6"
        >
          {/* Top Right Edit Button */}
          <div className="absolute top-6 right-6">
            <Button
              type="submit"
              className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded"
            >
              Save Changes
            </Button>
            <Button
              onClick={() => setEditable(false)}
              type="submit"
              className="bg-gray-900 hover:bg-black ml-4 text-white px-4 py-2 rounded"
            >
              Cancel
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <img
              src={formData.profile_photo_url}
              alt="Profile"
              className="w-48 h-48 rounded-full object-cover border"
            />
            <div>
              <h2 className="text-2xl font-bold">
                {formData.first_name} {formData.last_name}
              </h2>
              <p className="text-gray-500 text-sm">
                Joined on{" "}
                {new Date(candidate.registration_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-gray-500">First Name</label>
              <input
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            </div>

            <div>
              <label className="text-gray-500">Last Name</label>
              <input
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            </div>

            <div>
              <label className="text-gray-500">Email</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            </div>

            <div>
              <label className="text-gray-500">Phone</label>
              <Controller
                control={control}
                name="phone"
                render={({ field }) => (
                  <PhoneInput
                    {...field}
                    defaultCountry="IN"
                    international
                    countryCallingCodeEditable={false}
                    className="w-full border p-2 rounded"
                  />
                )}
              />
              {/* {errors.phone && (
                <p className="text-red-500 text-xs">{errors.phone.message}</p>
              )} */}
            </div>

            <div>
              <label className="text-gray-500">Date of Birth</label>
              <input
                name="date_of_birth"
                type="date"
                value={formData.date_of_birth.slice(0, 10)}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            </div>

            <div>
              <label className="text-gray-500">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-gray-500">Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              ></textarea>
            </div>

            <div className="sm:col-span-2">
              <label className="text-gray-500">Port-Folio URL</label>
              <textarea
                name="portfolio-url"
                value={formData.portfolio_url}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              ></textarea>
            </div>
          </div>

          {/* Resume Section */}
          <div className="mt-6 border-t pt-4">
            <h3 className="text-lg font-semibold mb-2">Documents</h3>
            <label className="text-gray-500">Resume Link</label>
            <input
              name="resume_url"
              type="url"
              value={formData.resume_url}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>
        </form>
      ) : (
        <div className="relative max-w-3xl w-full mx-auto p-6 bg-white rounded-xl shadow-md space-y-6">
          <div className="flex items-center gap-4">
            <img
              src={candidate.profile_photo_url}
              alt="Profile"
              className="w-48 h-48 rounded-full object-cover border"
            />
            <div>
              <h2 className="text-2xl font-bold">
                {candidate.first_name} {candidate.last_name}
              </h2>
              <p className="text-gray-500 text-sm">
                Joined on{" "}
                {new Date(candidate.registration_date).toLocaleDateString()}
              </p>
              <Button
                onClick={() => setEditable(true)}
                className="absolute top-6 right-6 min-w1.5 m-7 sm:w-auto bg-gray-900 hover:bg-black cursor-pointer text-white"
              >
                Edit Profile
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-medium">{candidate.email}</p>
            </div>

            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-medium">{candidate.phone}</p>
            </div>

            <div>
              <p className="text-gray-500">Date of Birth</p>
              <p className="font-medium">
                {new Date(candidate.date_of_birth).toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Gender</p>
              <p className="font-medium capitalize">{candidate.gender}</p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-gray-500">Address</p>
              <p className="font-medium">{candidate.address}</p>
            </div>
          </div>

          <div className="sm:col-span-2">
            <p className="text-gray-500">Port-Folio URL</p>
            <p className="font-medium">{candidate.portfolio_url}</p>
          </div>

          {/* Document Section */}
          <div className="mt-6 border-t pt-4">
            <h3 className="text-lg font-semibold mb-2">Documents</h3>
            {candidate.resume_url ? (
              <div>
                <p className="text-gray-500">Resume</p>
                <a
                  href={candidate.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  View Resume
                </a>
              </div>
            ) : (
              <p className="text-gray-500 italic">No resume uploaded.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
