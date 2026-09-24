import { useState, useEffect } from "react";
import { IoMdRefresh } from "react-icons/io";

interface Wish {
  _id: string;
  name: string;
  attendance: string;
  guests: number;
  message: string;
  createdAt: string;
}

const WishesList = () => {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false); // Add loading state

  const fetchWishes = async (pageNumber: number) => {
    setLoading(true); // Set loading to true when fetching
    try {
      const response = await fetch(`/api/get?page=${pageNumber}&limit=5`);
      if (!response.ok) {
        throw new Error(`Error fetching wishes: ${response.statusText}`);
      }

      const data = await response.json();
      setWishes(data.wishes);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching wishes:", error);
    } finally {
      setLoading(false); // Set loading to false after fetching
    }
  };

  useEffect(() => {
    fetchWishes(page);
  }, [page]);

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleRefresh = () => {
    fetchWishes(page); // Re-fetch the current page
  };

  return (
    <div className="bg-white text-[#343434] p-4 rounded-2xl mt-6 border border-sage/20 shadow-sm font-vietnam">
      <div className="flex items-center justify-between mb-3">
        <p className="font-playfair text-brown text-lg">Lời chúc từ mọi người</p>
        <button
          onClick={handleRefresh}
          className={`text-sage p-2 -m-2 ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={loading} // Disable while loading
        >
          {loading ? (
            <span className="text-xs">Đang làm mới...</span>
          ) : (
            <IoMdRefresh className="w-6 h-6" />
          )}
        </button>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {wishes.length === 0 ? (
          <p className="text-sm text-[#7D7D7D]">Chưa có lời chúc nào</p>
        ) : (
          wishes.map((wish) => (
            <div key={wish._id} className="mb-4">
              <p className="font-semibold text-brown">{wish.name}</p>
              <p className="text-xs my-1 text-[#7D7D7D]">
                {new Date(wish.createdAt).toLocaleString("vi-VN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                })}
              </p>
              <p className="text-sm">{wish.message}</p>
              <hr className="my-3 border-sage/20" />
            </div>
          ))
        )}
      </div>

      <div className="flex justify-between mt-4 text-sm">
        <button
          onClick={handlePreviousPage}
          className={`text-sage px-3 py-2 -mx-3 -my-2 ${
            page === 1 ? "opacity-40 cursor-not-allowed" : ""
          }`}
          disabled={page === 1}
        >
          Trước
        </button>
        <p className="text-xs text-[#7D7D7D] self-center">
          Trang {page}/{totalPages}
        </p>
        <button
          onClick={handleNextPage}
          className={`text-sage px-3 py-2 -mx-3 -my-2 ${
            page === totalPages ? "opacity-40 cursor-not-allowed" : ""
          }`}
          disabled={page === totalPages}
        >
          Tiếp
        </button>
      </div>
    </div>
  );
};

export default WishesList;
