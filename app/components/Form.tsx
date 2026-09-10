import React, { useState } from "react";

const Form = () => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    if (!form) {
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      attendance: formData.get("attendance"),
      guests: formData.get("guests"),
      message: formData.get("message"),
    };


    if (!data.name || !data.attendance || !data.guests || !data.message) {
      alert("Vui lòng điền đầy đủ thông tin!");
      setLoading(false);
      return;
    }

    const response = await fetch("/api/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      // Reset the form if submission is successful
      form.reset();
      alert("Gửi lời chúc thành công!");
    } else {
      alert("Gửi lời chúc thất bại, vui lòng thử lại!");
    }

    setLoading(false); // Set loading to false after response
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      {/* Form fields */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-white">
          Họ và tên
        </label>
        <input
          type="text"
          name="name"
          id="name"
          className="block w-full p-2 mt-1 bg-white/10 text-white border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label
          htmlFor="attendance"
          className="block text-sm font-medium text-white"
        >
          Tình trạng tham dự
        </label>
        <select
          id="attendance"
          name="attendance"
          className="block w-full p-2 mt-1 bg-black/40 text-white border border-gray-300 rounded-md shadow-sm  sm:text-sm"
          required
        >
          <option value="">Chọn tình trạng tham dự</option>
          <option value="Tham dự">Tham dự</option>
          <option value="Không tham dự">Không tham dự</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="guests"
          className="block text-sm font-medium text-white"
        >
          Số lượng khách
        </label>
        <select
          id="guests"
          name="guests"
          className="block w-full p-2 mt-1  bg-black/40 text-white border border-gray-300 rounded-md shadow-sm  sm:text-sm"
          required
        >
          <option value="">Chọn số lượng khách</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-white"
        >
          Lời chúc
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className="block w-full p-2 mt-1 bg-white/10 text-white border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <button
          type="submit"
          className="block w-full p-2 text-sm font-medium text-center text-black bg-white border border-transparent rounded-md shadow-sm"
          disabled={loading} 
        >
          {loading ? "Đang gửi..." : "Gửi"}
        </button>
      </div>
    </form>
  );
};

export default Form;
