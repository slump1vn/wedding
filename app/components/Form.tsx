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
    <form onSubmit={handleSubmit} className="space-y-4 font-vietnam">
      {/* Form fields */}
      <div>
        <label htmlFor="name" className="block text-sm text-brown text-center mb-1">
          Tên
        </label>
        <input
          type="text"
          name="name"
          id="name"
          className="block w-full p-2.5 bg-white text-[#343434] border border-sage/30 rounded-md shadow-sm focus:border-sage focus:ring-sage sm:text-sm"
          required
        />
      </div>

      <div>
        <label
          htmlFor="attendance"
          className="block text-sm text-brown text-center mb-1"
        >
          Tình trạng tham dự
        </label>
        <select
          id="attendance"
          name="attendance"
          className="block w-full p-2.5 bg-white text-[#343434] border border-sage/30 rounded-md shadow-sm sm:text-sm"
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
          className="block text-sm text-brown text-center mb-1"
        >
          Số lượng khách
        </label>
        <select
          id="guests"
          name="guests"
          className="block w-full p-2.5 bg-white text-[#343434] border border-sage/30 rounded-md shadow-sm sm:text-sm"
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
          className="block text-sm text-brown text-center mb-1"
        >
          Lời nhắn gửi
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className="block w-full p-2.5 bg-white text-[#343434] border border-sage/30 rounded-md shadow-sm focus:border-sage focus:ring-sage sm:text-sm"
          required
        />
      </div>

      <div className="text-center pt-2">
        <button
          type="submit"
          className="px-8 py-2.5 text-sm font-medium text-center text-white bg-sage hover:bg-sage/90 border border-transparent rounded-md shadow-sm transition disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Đang gửi..." : "Gửi lời chúc"}
        </button>
      </div>
    </form>
  );
};

export default Form;
