import { useState, useEffect, useCallback, useMemo } from 'react';

// --- Helper Data (นอก Component) ---
const thaiMonths = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];
const thaiDaysShort = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

// [อัปเดต] เปลี่ยนจาก Emoji เป็น URL รูปภาพ
const moodEmojis = { // ยังคงเก็บไว้สำหรับฟังก์ชัน Share
    "ยอดเยี่ยม": "😄",
    "ดี": "🙂",
    "เฉยๆ": "😐",
    "ไม่ดี": "😟",
    "แย่มาก": "😢"
};
const moodImageUrls = {
    "ยอดเยี่ยม": "https://gold-brilliant-bonobo-261.mypinata.cloud/ipfs/bafybeifm37c2kts5d53qsphtpmjpiaqpnxsc3gkoxglie7vvwigzhfwm6i/h1.png",
    "ดี": "https://gold-brilliant-bonobo-261.mypinata.cloud/ipfs/bafybeifm37c2kts5d53qsphtpmjpiaqpnxsc3gkoxglie7vvwigzhfwm6i/h2.png",
    "เฉยๆ": "https://gold-brilliant-bonobo-261.mypinata.cloud/ipfs/bafybeifm37c2kts5d53qsphtpmjpiaqpnxsc3gkoxglie7vvwigzhfwm6i/h3.png",
    "ไม่ดี": "https://gold-brilliant-bonobo-261.mypinata.cloud/ipfs/bafybeifm37c2kts5d53qsphtpmjpiaqpnxsc3gkoxglie7vvwigzhfwm6i/s1.png",
    "แย่มาก": "https://gold-brilliant-bonobo-261.mypinata.cloud/ipfs/bafybeifm37c2kts5d53qsphtpmjpiaqpnxsc3gkoxglie7vvwigzhfwm6i/s2.png"
};

const moodKeys = ["ยอดเยี่ยม", "ดี", "เฉยๆ", "ไม่ดี", "แย่มาก"];
const moodColors = {
    "ยอดเยี่ยม": "bg-green-400",
    "ดี": "bg-lime-400",
    "เฉยๆ": "bg-yellow-400",
    "ไม่ดี": "bg-orange-400",
    "แย่มาก": "bg-red-400",
};
// [v2] map mood เป็นตัวเลขสำหรับกราฟ
const moodValues = { "ยอดเยี่ยม": 5, "ดี": 4, "เฉยๆ": 3, "ไม่ดี": 2, "แย่มาก": 1, 0: 0 };

// [v1] ข้อมูลแท็กกิจกรรม
const defaultActivities = [
    { id: 'work', label: '💻 งาน', emoji: '💻' },
    { id: 'exercise', label: '🏋️ ออกกำลังกาย', emoji: '🏋️' },
    { id: 'family', label: '👨‍👩‍👧‍👦 ครอบครัว', emoji: '👨‍👩‍👧‍👦' },
    { id: 'friends', label: '🧑‍🤝‍🧑 เพื่อน', emoji: '🧑‍🤝‍🧑' },
    { id: 'hobby', label: '🎨 งานอดิเรก', emoji: '🎨' },
    { id: 'relax', label: '🧘 ผ่อนคลาย', emoji: '🧘' },
    { id: 'food', label: '🍔 อาหาร', emoji: '🍔' },
    { id: 'sleep', label: '😴 นอน', emoji: '😴' },
];

// [v3] คำคมสร้างแรงบันดาลใจ
const dailyQuotes = [
    "จงใช้ชีวิตในวันนี้ให้เหมือนไม่มีวันพรุ่งนี้",
    "ความสำเร็จคือผลรวมของความพยายามเล็กๆ ที่เกิดขึ้นซ้ำๆ ทุกวัน",
    "อุปสรรคคือสิ่งที่ทำให้เราแข็งแกร่งขึ้น",
    "จงเป็นตัวเองในเวอร์ชันที่ดีที่สุด",
    "การเปลี่ยนแปลงเริ่มต้นที่ก้าวแรกเสมอ",
    "ทัศนคติที่ดีคือจุดเริ่มต้นของความสุข",
    "อย่ากลัวที่จะล้มเหลว แต่จงกลัวที่จะไม่พยายาม",
];

const WHATS_NEW_VERSION_KEY = 'seenWhatsNew_v3_uploads_pdf_fix'; // อัปเดต Key

// --- Helper Functions (นอก Component) ---
function formatDateYYYYMMDD(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function formatDateThai(date) {
    const d = new Date(date.split('T')[0] + 'T00:00:00'); 
    const day = d.getDate();
    const m = thaiMonths[d.getMonth()];
    const y = d.getFullYear() + 543;
    return `${day} ${m} ${y}`;
}

function readStoredJson(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch (error) {
        console.error(`Failed to parse stored data: ${key}`, error);
        return fallback;
    }
}

// --- Main App Component ---
export default function App() {

    // --- State ---
    const [moodData, setMoodData] = useState(() => readStoredJson('moodData', {})); // { "YYYY-MM-DD": { mood, note, tags, pinned, photoData } }
    const [selectedMood, setSelectedMood] = useState(null);
    const [note, setNote] = useState("");
    const [message, setMessage] = useState({ text: "", isError: false, visible: false });
    const [currentDate, setCurrentDate] = useState(new Date()); 
    const [modalData, setModalData] = useState(null); 
    const [modalEditMood, setModalEditMood] = useState(null);
    const [modalEditNote, setModalEditNote] = useState("");
    const [currentView, setCurrentView] = useState('entry'); 
   
    
    // State (ฟีเจอร์ v1)
    const [selectedActivities, setSelectedActivities] = useState([]);
    const [modalEditActivities, setModalEditActivities] = useState([]);
    const [confirmDeleteAllModalVisible, setConfirmDeleteAllModalVisible] = useState(false);
    const [showDeleteConfirmInModal, setShowDeleteConfirmInModal] = useState(false);

    // State (ฟีเจอร์ v2)
    const [customActivities, setCustomActivities] = useState(() => readStoredJson('customActivities', [])); 
    const [newActivityLabel, setNewActivityLabel] = useState("");
    const [searchTerm, setSearchTerm] = useState(""); 
    const [showBackToTop, setShowBackToTop] = useState(false); 
    const [showWhatsNew, setShowWhatsNew] = useState(false); 

    // [v3] State (ฟีเจอร์ใหม่ v3)
    const [appPin, setAppPin] = useState(null); 
    const [isLocked, setIsLocked] = useState(true); 
    const [pinInput, setPinInput] = useState(""); 
    const [pinError, setPinError] = useState("");
    
    // [อัปเดต] เปลี่ยนจาก photoLink เป็น photoData (Base64)
    const [photoData, setPhotoData] = useState(null); 
    const [modalEditPhotoData, setModalEditPhotoData] = useState(null);

    const [modalEditPinned, setModalEditPinned] = useState(false); 
    const [showPinnedOnly, setShowPinnedOnly] = useState(false); 
    const [useGratitudeTemplate, setUseGratitudeTemplate] = useState(false); 
    const [calendarView, setCalendarView] = useState('emoji'); 
    
    // [อัปเดต] State ใหม่สำหรับช่วยในการพิมพ์
    const [isPrinting, setIsPrinting] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);


    // --- Memoized Values ---
    const todayString = useMemo(() => formatDateYYYYMMDD(new Date()), []);
    const todayEntry = useMemo(() => moodData[todayString], [moodData, todayString]);
    const isDetailsVisible = useMemo(() => !!selectedMood || !!todayEntry, [selectedMood, todayEntry]);

    // [v2] รวมแท็กเริ่มต้นและแท็กที่ผู้ใช้สร้าง
    const allActivities = useMemo(() => [...defaultActivities, ...customActivities], [customActivities]);
    
    // [v3] กรอง "บันทึกที่ผ่านมา" (รวมการค้นหา + การ Pin)
    const filteredPastEntries = useMemo(() => {
        return Object.keys(moodData)
            .filter(date => date !== todayString)
            .sort((a, b) => b.localeCompare(a)) 
            .map(date => ({ dateString: date, entry: moodData[date] }))
            .filter(({ entry }) => {
                // [ESLINT FIX] ลบ dateString ที่ไม่ได้ใช้งาน
                const searchMatch = entry.note ? entry.note.toLowerCase().includes(searchTerm.toLowerCase()) : searchTerm === "";
                const pinMatch = showPinnedOnly ? (entry.pinned === true) : true;
                return searchMatch && pinMatch;
            });
    }, [moodData, todayString, searchTerm, showPinnedOnly]);

    // [v1] สถิตินับอารมณ์
    const moodStats = useMemo(() => {
        const counts = moodKeys.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
        let total = 0;
        
        for (const entry of Object.values(moodData)) {
            // [ESLINT FIX]: เปลี่ยน .hasOwnProperty
            if (entry.mood && Object.prototype.hasOwnProperty.call(counts, entry.mood)) {
                counts[entry.mood]++;
                total++;
            }
        }
        const percentages = moodKeys.reduce((acc, key) => ({
            ...acc,
            [key]: total === 0 ? 0 : Math.round((counts[key] / total) * 100)
        }), {});
        return { counts, percentages, total };
    }, [moodData]);

    // [v1 & v2] สถิติ Streak (ปัจจุบัน และ สูงสุด)
    const { currentStreak, longestStreak } = useMemo(() => {
        let current = 0, longest = 0, streak = 0;
        let checkDate = new Date();
        while (true) {
            if (moodData[formatDateYYYYMMDD(checkDate)]) {
                current++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else break;
        }
        checkDate = new Date();
        for (let i = 0; i < 365 * 10; i++) {
            if (moodData[formatDateYYYYMMDD(checkDate)]) streak++;
            else {
                if (streak > longest) longest = streak;
                streak = 0;
            }
            checkDate.setDate(checkDate.getDate() - 1);
        }
        if (streak > longest) longest = streak;
        return { currentStreak: current, longestStreak: longest };
    }, [moodData]);

    // [v2] สถิติกราฟ
    const moodChartData = useMemo(() => {
        const data = [];
        let checkDate = new Date();
        for (let i = 0; i < 30; i++) {
            const dateStr = formatDateYYYYMMDD(checkDate);
            const entry = moodData[dateStr];
            data.push({
                date: dateStr,
                value: entry ? (moodValues[entry.mood] || 0) : 0
            });
            checkDate.setDate(checkDate.getDate() - 1);
        }
        return data.reverse(); 
    }, [moodData]);

    // [v2] สถิติความสัมพันธ์ กิจกรรม-อารมณ์
    const activityMoodStats = useMemo(() => {
        const stats = {}; 
        for (const entry of Object.values(moodData)) {
            if (entry.tags && entry.tags.length > 0 && entry.mood) {
                entry.tags.forEach(tagId => {
                    if (!stats[tagId]) stats[tagId] = {};
                    if (!stats[tagId][entry.mood]) stats[tagId][entry.mood] = 0;
                    stats[tagId][entry.mood]++;
                });
            }
        }
        const sortedStats = Object.entries(stats).map(([tagId, moodCounts]) => {
            const activity = allActivities.find(a => a.id === tagId);
            return {
                activity: activity || { id: tagId, label: tagId },
                counts: Object.entries(moodCounts).sort((a, b) => b[1] - a[1]) 
            };
        }).sort((a, b) => {
            const totalA = a.counts.reduce((sum, [, count]) => sum + count, 0);
            const totalB = b.counts.reduce((sum, [, count]) => sum + count, 0);
            return totalB - totalA;
        });
        return sortedStats;
    }, [moodData, allActivities]);

    // [v3] "On This Day" Throwback
    const onThisDayEntry = useMemo(() => {
        const today = new Date();
        const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        const oneYearAgoStr = formatDateYYYYMMDD(oneYearAgo);
        return moodData[oneYearAgoStr] ? { date: oneYearAgoStr, entry: moodData[oneYearAgoStr] } : null;
    }, [moodData]);

    // [v3] Weekly Mood Summary
    const weeklyMoodAverage = useMemo(() => {
        let totalValue = 0;
        let count = 0;
        let checkDate = new Date();
        for (let i = 0; i < 7; i++) {
            const dateStr = formatDateYYYYMMDD(checkDate);
            const entry = moodData[dateStr];
            if (entry && entry.mood) {
                totalValue += (moodValues[entry.mood] || 0);
                count++;
            }
            checkDate.setDate(checkDate.getDate() - 1);
        }
        const avg = count === 0 ? 0 : totalValue / count;
        // หา mood key ที่ใกล้เคียงที่สุด
        if (avg === 0) return { avg: 0, mood: null };
        const closestMood = Object.entries(moodValues).reduce((prev, [key, value]) => {
            if (value === 0) return prev;
            return (Math.abs(value - avg) < Math.abs(moodValues[prev] - avg)) ? key : prev;
        }, "เฉยๆ");
        
        return { avg: avg.toFixed(1), mood: closestMood };
    }, [moodData]);

    // [v3] Daily Quote
    const dailyQuote = useMemo(() => {
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        return dailyQuotes[dayOfYear % dailyQuotes.length];
    }, []);


    // --- Event Handlers & Callbacks ---
    const showMessage = useCallback((text, isError = false) => {
        setMessage({ text, isError, visible: true });
        setTimeout(() => {
            setMessage({ text: "", isError: false, visible: false });
        }, 3000);
    }, []);

    // --- Effects ---
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => { // Load from localStorage
        try {
            // [v3] โหลดการตั้งค่า v3
            const storedPin = localStorage.getItem('appPin');
            if (storedPin) {
                setAppPin(storedPin);
                setIsLocked(true); // ถ้ามี PIN ให้ล็อกแอป
            } else {
                setIsLocked(false); // ไม่มี PIN ไม่ต้องล็อก
            }
            const storedTemplate = localStorage.getItem('useTemplate') === 'true';
            setUseGratitudeTemplate(storedTemplate);
            const storedCalendarView = localStorage.getItem('calendarView') || 'emoji';
            setCalendarView(storedCalendarView);

            // [v2] ตรวจสอบ Modal "มีอะไรใหม่"
            const seenWhatsNew = localStorage.getItem(WHATS_NEW_VERSION_KEY);
            if (!seenWhatsNew && !storedPin) { // [v3] ถ้าแอปไม่ติดล็อก ให้แสดง "มีอะไรใหม่"
                setShowWhatsNew(true);
            }

        } catch (error) {
            console.error("Failed to load data from localStorage", error);
        } finally {
            setIsHydrated(true);
        }
    }, []);

    useEffect(() => { // Save moodData
        if (isHydrated) {
            localStorage.setItem('moodData', JSON.stringify(moodData));
        }
    }, [moodData, isHydrated]);

    useEffect(() => { // Save customActivities
        if (isHydrated) {
            localStorage.setItem('customActivities', JSON.stringify(customActivities));
        }
    }, [customActivities, isHydrated]);

    useEffect(() => { // อัปเดตฟอร์มวันนี้
        if (todayEntry) {
            setSelectedMood(todayEntry.mood);
            setNote(todayEntry.note);
            setSelectedActivities(todayEntry.tags || []); 
            setPhotoData(todayEntry.photoData || null); // [อัปเดต]
        } else {
            setSelectedMood(null);
            setNote(useGratitudeTemplate ? "วันนี้ฉันรู้สึกขอบคุณสำหรับ..." : ""); 
            setSelectedActivities([]); 
            setPhotoData(null); // [อัปเดต]
        }
    }, [todayEntry, useGratitudeTemplate]); 
    /* eslint-enable react-hooks/set-state-in-effect */
    


    useEffect(() => { // Scroll listener
        const mainContent = document.querySelector('main');
        if (!mainContent) return;
        const handleScroll = () => {
            if (mainContent.scrollTop > 300) setShowBackToTop(true);
            else setShowBackToTop(false);
        };
        mainContent.addEventListener('scroll', handleScroll);
        return () => mainContent.removeEventListener('scroll', handleScroll);
    }, [currentView]); 

    // [v3] Effects สำหรับบันทึกการตั้งค่า v3
    useEffect(() => {
        localStorage.setItem('useTemplate', useGratitudeTemplate);
    }, [useGratitudeTemplate]);
    useEffect(() => {
        localStorage.setItem('calendarView', calendarView);
    }, [calendarView]);

    // [อัปเดต] Effect ใหม่สำหรับจัดการการพิมพ์
    useEffect(() => {
        if (isPrinting) {
            // รอให้ React render หน้าที่ถูกต้อง (currentView) เสร็จก่อน
            setTimeout(() => {
                window.print();
                setIsPrinting(false); // รีเซ็ตสถานะหลังเปิดหน้าต่างพิมพ์
            }, 500); // 500ms delay เพื่อให้แน่ใจว่า DOM อัปเดตแล้ว
        }
    }, [isPrinting]);


    // --- Core Save Functions ---
    const handleSaveTodayEntry = useCallback(async () => {
        if (!selectedMood) {
            showMessage("กรุณาเลือกอารมณ์ของคุณก่อน", true);
            return;
        }
        setMoodData(prevData => ({
            ...prevData,
            [todayString]: {
                ...prevData[todayString], 
                mood: selectedMood,
                note: note,
                tags: selectedActivities,
                photoData: photoData // [อัปเดต]
            }
        }));
        showMessage("บันทึกสำเร็จ!", false);
    }, [selectedMood, note, selectedActivities, photoData, todayString, showMessage]);

    const handleSaveModalEntry = useCallback(async () => {
        if (!modalData?.dateString) return;
        if (!modalEditMood) {
            showMessage("กรุณาเลือกอารมณ์ของคุณก่อน", true);
            return;
        }
        setMoodData(prevData => ({
            ...prevData,
            [modalData.dateString]: {
                mood: modalEditMood,
                note: modalEditNote,
                tags: modalEditActivities,
                photoData: modalEditPhotoData, // [อัปเดต]
                pinned: modalEditPinned 
            }
        }));
        showMessage("บันทึกสำเร็จ!", false);
        setModalData(null); 
    }, [modalData, modalEditMood, modalEditNote, modalEditActivities, modalEditPhotoData, modalEditPinned, showMessage]);

    // --- Other Handlers ---
    const handleMoodSelect = (mood) => {
        setSelectedMood(mood);
    };
    const handlePrevMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };
    const handleNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    // [อัปเดต] สร้าง Handler สำหรับปุ่ม "แก้ไข" วันนี้โดยเฉพาะ
    const handleEditToday = () => {
        const entry = moodData[todayString];
        setModalData({ dateString: todayString, entry }); 
        setModalEditMood(entry?.mood || null); 
        setModalEditNote(entry?.note || ""); 
        setModalEditActivities(entry?.tags || []); 
        setModalEditPhotoData(entry?.photoData || null); 
        setModalEditPinned(entry?.pinned || false); 
        setShowDeleteConfirmInModal(false); 
    };
    
    const handleCalendarDayClick = (dateString) => {
        if (dateString === todayString) {
            // ถ้าคลิกวันปัจจุบันในปฏิทิน ให้ไปที่หน้า 'entry'
            setCurrentView('entry');
            return;
        }
        // ถ้าเป็นวันอื่น ให้เปิด Modal
        const entry = moodData[dateString];
        setModalData({ dateString, entry }); 
        setModalEditMood(entry?.mood || null); 
        setModalEditNote(entry?.note || ""); 
        setModalEditActivities(entry?.tags || []); 
        setModalEditPhotoData(entry?.photoData || null); // [อัปเดต]
        setModalEditPinned(entry?.pinned || false); 
        setShowDeleteConfirmInModal(false); 
    };
    const handleCloseModal = () => {
        setModalData(null);
    };

    // [อัปเดต] Photo Upload Handler
    const handlePhotoUpload = (event, isModal = false) => {
        const file = event.target.files[0];
        if (!file) return;

        // จำกัดขนาดไฟล์ 2MB
        if (file.size > 2 * 1024 * 1024) {
            showMessage("ขนาดรูปภาพต้องไม่เกิน 2MB", true);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            if (isModal) {
                setModalEditPhotoData(e.target.result);
            } else {
                setPhotoData(e.target.result);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleActivityToggle = (activityId, isModal = false) => {
        const handler = isModal ? setModalEditActivities : setSelectedActivities;
        handler(prev => 
            prev.includes(activityId) 
            ? prev.filter(id => id !== activityId) 
            : [...prev, activityId]
        );
    };

    // [อัปเดต] ฟังก์ชันใหม่สำหรับสั่งพิมพ์
    const handlePrintStats = () => {
        setCurrentView('stats'); // 1. เปลี่ยนไปหน้าสถิติ
        setIsPrinting(true);   // 2. ตั้งค่าสถานะการพิมพ์ (Effect จะทำงานต่อ)
    };

    const handleDeleteAllData = () => {
        setConfirmDeleteAllModalVisible(true);
    };
    const performDeleteAllData = () => {
        setMoodData({});
        setCustomActivities([]); 
        localStorage.removeItem('moodData'); 
        localStorage.removeItem('customActivities');
        localStorage.removeItem('appPin'); 
        localStorage.removeItem('useTemplate');
        localStorage.removeItem('calendarView');
        setAppPin(null); 
        setIsLocked(false); 
        setConfirmDeleteAllModalVisible(false);
        showMessage("ลบข้อมูลทั้งหมดเรียบร้อยแล้ว");
    };

    const handleDeleteEntry = (dateString) => {
        setMoodData(prevData => {
            const newData = { ...prevData };
            delete newData[dateString];
            return newData;
        });
        handleCloseModal();
        showMessage("ลบรายการสำเร็จ");
    };

    const handleAddCustomActivity = () => {
        if (newActivityLabel.trim() === "") return;
        const newId = `custom_${new Date().getTime()}`;
        setCustomActivities(prev => [...prev, { id: newId, label: newActivityLabel.trim(), emoji: '🏷️' }]);
        setNewActivityLabel("");
    };

    const handleDeleteCustomActivity = (idToDelete) => {
        setCustomActivities(prev => prev.filter(a => a.id !== idToDelete));
        setMoodData(prevData => {
            const newData = { ...prevData };
            for (const date in newData) {
                if (newData[date].tags && newData[date].tags.includes(idToDelete)) {
                    newData[date].tags = newData[date].tags.filter(tag => tag !== idToDelete);
                }
            }
            return newData;
        });
    };

    const scrollToTop = () => {
        const mainContent = document.querySelector('main');
        if (mainContent) mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCloseWhatsNew = () => {
        localStorage.setItem(WHATS_NEW_VERSION_KEY, 'true');
        setShowWhatsNew(false);
    };

    // [v3] Handlers for PIN Lock
    const handlePinInput = (num) => {
        if (pinInput.length < 4) {
            setPinInput(pinInput + num);
        }
    };
    const handlePinDelete = () => {
        setPinInput(pinInput.slice(0, -1));
    };
    const handleUnlock = () => {
        if (pinInput === appPin) {
            setIsLocked(false);
            setPinInput("");
            setPinError("");
            // ถ้ายังไม่เคยเห็น "มีอะไรใหม่" ให้แสดงตอนนี้
            if (!localStorage.getItem(WHATS_NEW_VERSION_KEY)) {
                setShowWhatsNew(true);
            }
        } else {
            setPinError("PIN ไม่ถูกต้อง");
            setPinInput("");
        }
    };
    const handleSetPin = (newPin) => {
        if (newPin.length === 4) {
            setAppPin(newPin);
            localStorage.setItem('appPin', newPin);
            showMessage("ตั้งค่า PIN สำเร็จ!");
            return true;
        } else if (newPin.length === 0) {
            setAppPin(null);
            localStorage.removeItem('appPin');
            showMessage("ยกเลิก PIN สำเร็จ!");
            return true;
        }
        return false;
    };
    
    // [v3] Handlers for Sharing (อัปเดต: photoData)
    const handleShareEntry = () => {
        if (!modalData) return;
        const { dateString, entry } = modalData;
        const tags = entry.tags ? entry.tags.map(id => allActivities.find(a => a.id === id)?.label || id).join(', ') : 'ไม่มี';
        
        const shareText = `
บันทึกอารมณ์: ${formatDateThai(dateString)}
อารมณ์: ${entry.mood} ${moodEmojis[entry.mood]}
กิจกรรม: ${tags}
บันทึก: ${entry.note || 'ไม่มี'}
${entry.photoData ? `รูปภาพ: (แนบในแอป)` : ''}
        `;
        
        navigator.clipboard.writeText(shareText.trim())
            .then(() => showMessage("คัดลอกไปยังคลิปบอร์ดแล้ว!"))
            // [ESLINT FIX]: ลบ 'err' ที่ไม่ได้ใช้งาน
            .catch(() => showMessage("คัดลอกล้มเหลว", true));
    };


    // --- Render Components ---

    const renderActivitySelector = (selectedIds, handler) => (
        <div className="mb-4">
            <label className="block font-medium mb-2 dark:text-gray-300">กิจกรรมวันนี้:</label>
            <div className="flex flex-wrap gap-2">
                {allActivities.map(activity => (
                    <button key={activity.id} onClick={() => handler(activity.id)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors duration-200 ${
                            selectedIds.includes(activity.id) 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
                        }`}
                    > {activity.label} </button>
                ))}
            </div>
        </div>
    );

    const renderNavBar = () => {
        const navItems = [
            { view: 'entry', label: 'บันทึก', icon: ( <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /> </svg> ) },
            { view: 'calendar', label: 'ปฏิทิน', icon: ( <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-18 0h18" /> </svg> ) },
            { view: 'stats', label: 'สถิติ', icon: ( <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /> </svg> ) },
            { view: 'settings', label: 'ตั้งค่า', icon: ( <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" /> </svg> ) },
        ];

        return (
            // [อัปเดต] เพิ่มคลาส no-print
            <nav className="no-print fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-md z-30 dark:bg-gray-800 dark:border-gray-700">
                <div className="container mx-auto flex justify-between items-center h-16 px-2 sm:px-4">
                    <div className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200">
                        Feel it
                    </div>
                    <div className="flex space-x-1 sm:space-x-2">
                        {navItems.map(item => {
                            const isActive = currentView === item.view;
                            const activeClass = 'bg-emerald-100 text-emerald-700 dark:bg-gray-700 dark:text-emerald-300';
                            const inactiveClass = 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700';
                            
                            return (
                                <button 
                                    key={item.view}
                                    id={`nav-${item.view}-btn`}
                                    className={`nav-btn flex items-center space-x-2 p-1.5 sm:p-2 rounded-lg transition-colors duration-200 ${isActive ? activeClass : inactiveClass}`}
                                    data-view={item.view}
                                    onClick={() => setCurrentView(item.view)}
                                >
                                    {item.icon}
                                    <span className="text-sm font-medium hidden sm:inline">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </nav>
        );
    };

    const renderEntryPage = () => (
        <div id="entry-section" className="w-full max-w-md md:max-w-lg lg:max-w-xl mx-auto">
            <header className="text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">บันทึกอารมณ์</h1>
                <p className="text-gray-600 mt-2 text-sm sm:text-base dark:text-gray-400">วันนี้คุณรู้สึกอย่างไร?</p>
            </header>

            {/* [v3] Daily Quote */}
            <div className="mb-6 text-center italic text-gray-600 dark:text-gray-400">
                "{dailyQuote}"
            </div>

            {/* [v3] "On This Day" Throwback */}
            {onThisDayEntry && (
                <div className="mb-6 bg-white p-4 rounded-2xl shadow-lg dark:bg-gray-800 border-l-4 border-emerald-500">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-200">เมื่อ 1 ปีที่แล้วในวันนี้...</h4>
                    <div className="flex items-center mt-2">
                         {/* [อัปเดต] ใช้ img */}
                        <img src={moodImageUrls[onThisDayEntry.entry.mood]} alt={onThisDayEntry.entry.mood} className="w-8 h-8 mr-3"/>
                        <p className="text-gray-600 dark:text-gray-400 italic truncate">
                            {onThisDayEntry.entry.note || "คุณบันทึกอารมณ์ไว้"}
                        </p>
                    </div>
                </div>
            )}

            {/* [อัปเดต] ตรรกะใหม่: แสดงการ์ดสรุปผล ถ้าบันทึกวันนี้แล้ว */}
            {!todayEntry ? (
                // --- 1. การ์ดสำหรับบันทึก (ถ้ายังไม่บันทึก) ---
                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg mb-6 dark:bg-gray-800">
                    <h2 className="text-lg sm:text-xl font-semibold mb-6 text-center text-gray-700 dark:text-gray-300">
                        {`วันนี้, ${formatDateThai(todayString)}`}
                    </h2>
                    
                    <div className="flex justify-around mb-6">
                        {moodKeys.map(mood => (
                            <button 
                                key={mood}
                                className={`mood-btn p-2 rounded-full transition-all duration-200 ease-in-out border-2 ${
                                    selectedMood === mood 
                                    ? 'scale-115 border-emerald-500 shadow-[0_4px_10px_rgba(16,185,129,0.3)]' 
                                    : 'border-transparent'
                                }`}
                                data-mood={mood} 
                                title={mood}
                                onClick={() => handleMoodSelect(mood)}
                            >
                                <img src={moodImageUrls[mood]} alt={mood} className="w-12 h-12 sm:w-14 sm:h-14" />
                            </button>
                        ))}
                    </div>

                    <div 
                        id="entry-details-container" 
                        className={`mt-6 transition-all duration-400 ease-in-out overflow-hidden ${
                            isDetailsVisible ? 'opacity-100 max-h-[1500px]' : 'opacity-0 max-h-0' 
                        }`}
                    >
                        {renderActivitySelector(selectedActivities, (id) => handleActivityToggle(id, false))}
                        
                        {/* Photo Upload */}
                        <div className="mb-4">
                            <label className="block font-medium mb-2 dark:text-gray-300">แนบรูปภาพ (ไม่บังคับ):</label>
                            {!photoData ? (
                                <label className="w-full flex justify-center items-center px-4 py-3 bg-gray-50 dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                                    <svg className="h-6 w-6 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm16.5-1.5H3.75" />
                                    </svg>
                                    <span>เลือกรูปภาพ (สูงสุด 2MB)</span>
                                    <input 
                                        id="photo-upload-input" 
                                        type="file"
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={(e) => handlePhotoUpload(e, false)}
                                    />
                                </label>
                            ) : (
                                <div className="relative group">
                                    <img src={photoData} alt="Preview" className="mt-2 rounded-lg max-h-40 w-auto" />
                                    <button
                                        onClick={() => setPhotoData(null)}
                                        className="absolute top-0 right-0 m-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="mb-1">
                            <label htmlFor="note-input" className="block font-medium mb-2 dark:text-gray-300">บันทึกเพิ่มเติม:</label>
                            <textarea 
                                id="note-input" 
                                rows="5" 
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400" 
                                placeholder="มีอะไรอยากเล่าไหม..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                            <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1 pr-1">
                                {note.length} ตัวอักษร
                            </div>
                        </div>
                        <button 
                            id="save-button" 
                            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold shadow-md hover:bg-emerald-700 transition-colors duration-200 disabled:bg-gray-400 mt-4"
                            onClick={handleSaveTodayEntry}
                            disabled={!selectedMood}
                        >
                            บันทึก
                        </button>
                    </div>
                </div>
            ) : (
                // --- 2. การ์ดสรุปผล (ถ้าบันทึกวันนี้แล้ว) ---
                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg mb-6 dark:bg-gray-800">
                    <h2 className="text-lg sm:text-xl font-semibold mb-4 text-center text-gray-700 dark:text-gray-300">
                        บันทึกของวันนี้
                    </h2>
                    
                    <div className="text-center mb-4">
                        <img src={moodImageUrls[todayEntry.mood]} alt={todayEntry.mood} className="w-24 h-24 mx-auto" />
                        <p className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mt-2">{todayEntry.mood}</p>
                    </div>

                    <div className="space-y-4">
                        {todayEntry.photoData && (
                            <div>
                                <h4 className="font-semibold mb-2 dark:text-gray-300">รูปภาพวันนี้:</h4>
                                <img src={todayEntry.photoData} alt="Today's" className="rounded-lg w-full max-h-60 object-cover" />
                            </div>
                        )}
                        
                        {todayEntry.tags && todayEntry.tags.length > 0 && (
                            <div>
                                <h4 className="font-semibold mb-2 dark:text-gray-300">กิจกรรม:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {todayEntry.tags.map(tagId => {
                                        const activity = allActivities.find(a => a.id === tagId);
                                        return ( <span key={tagId} className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"> {activity ? activity.label : tagId} </span> );
                                    })}
                                </div>
                            </div>
                        )}

                        {todayEntry.note && (
                            <div>
                                <h4 className="font-semibold mb-2 dark:text-gray-300">บันทึก:</h4>
                                <p className="text-gray-700 whitespace-pre-wrap dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                                    {todayEntry.note}
                                </p>
                            </div>
                        )}

                        <button 
                            onClick={handleEditToday} // [อัปเดต] ใช้ Handler ใหม่
                            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold shadow-md hover:bg-emerald-700 transition-colors duration-200"
                        >
                            แก้ไขบันทึกวันนี้
                        </button>
                    </div>
                </div>
            )}
            
            {message.visible && (
                <div className={`mt-4 text-center font-medium ${message.isError ? 'text-red-500' : 'text-green-500'}`}>
                    {message.text}
                </div>
            )}

            <div id="past-entries-section" className="w-full">
                <div className="flex justify-between items-center mb-4 px-2">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200">บันทึกที่ผ่านมา</h3>
                    <button 
                        onClick={() => setShowPinnedOnly(prev => !prev)}
                        className={`p-2 rounded-full ${showPinnedOnly ? 'bg-red-100 text-red-700 dark:bg-red-900' : 'bg-gray-100 text-gray-500 dark:bg-gray-700'}`}
                        title={showPinnedOnly ? "แสดงทั้งหมด" : "แสดงเฉพาะที่ปักหมุด"}
                    >
                        <img 
                            src="https://gold-brilliant-bonobo-261.mypinata.cloud/ipfs/bafkreig47ahnijdhcwlazvkyz67wcgwwli3f56dvp6q7mdjwpyqvszx3pi" 
                            alt="Pin Icon" 
                            className="h-5 w-5" 
                        />
                    </button>
                </div>
                
                <div className="mb-4 relative">
                    <input 
                        type="text" 
                        placeholder="ค้นหาในบันทึก..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <svg className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                </div>

                <div id="past-entries-feed" className="space-y-4">
                    {filteredPastEntries.length === 0 ? (
                        <p className="text-center text-gray-500 bg-white p-4 rounded-2xl shadow-md dark:bg-gray-800 dark:text-gray-400">
                            {searchTerm ? "ไม่พบบันทึกที่ตรงกัน" : (showPinnedOnly ? "ไม่พบบันทึกที่ปักหมุด" : "ยังไม่มีบันทึกที่ผ่านมา")}
                        </p>
                    ) : (
                        filteredPastEntries.map(({ dateString, entry }) => (
                            <div key={dateString} className={`bg-white p-3 sm:p-4 rounded-2xl shadow-md transition-all hover:shadow-lg dark:bg-gray-800 ${entry.pinned ? 'border-l-4 border-red-500' : ''}`}>
                                <div className="flex justify-between items-start">
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                                        {formatDateThai(dateString)}
                                    </span>
                                    <img src={moodImageUrls[entry.mood] || 'https://placehold.co/40x40/ccc/ccc?text=?'} alt={entry.mood} className="w-10 h-10 ml-4"/>
                                </div>
                                
                                {entry.photoData && (
                                    <img src={entry.photoData} alt="Entry photo" className="mt-3 rounded-lg w-full max-h-60 object-cover" />
                                )}

                                {entry.tags && entry.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {entry.tags.map(tagId => {
                                            const activity = allActivities.find(a => a.id === tagId);
                                            return ( <span key={tagId} className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"> {activity ? activity.label : tagId} </span> );
                                        })}
                                    </div>
                                )}

                                {entry.note && ( <p className="text-gray-700 mt-3 whitespace-pre-wrap dark:text-gray-300"> {entry.note} </p> )}

                                <div className="mt-3 text-right">
                                    <button 
                                        onClick={() => handleCalendarDayClick(dateString)}
                                        className="text-sm font-medium text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
                                    >
                                        แก้ไข
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );

    const renderCalendarPage = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const emptyCells = Array(firstDayOfMonth).fill(null);
        const dayCells = Array(daysInMonth).fill(null).map((_, i) => i + 1);
        const todayCalString = formatDateYYYYMMDD(new Date());

        return (
            // [อัปเดต] เพิ่มคลาส print-area
            <div id="calendar-section" className="print-area w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto bg-white p-4 sm:p-6 rounded-2xl shadow-lg dark:bg-gray-800">
                
                <div id="calendar-header" className="flex justify-between items-center mb-4">
                    <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100 transition-colors dark:text-gray-300 dark:hover:bg-gray-700">
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /> </svg>
                    </button>
                    <h2 id="month-year" className="text-lg sm:text-xl font-semibold dark:text-gray-200"> {`${thaiMonths[month]} ${year + 543}`} </h2>
                    <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100 transition-colors dark:text-gray-300 dark:hover:bg-gray-700">
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /> </svg>
                    </button>
                </div>

                {/* [v3] Toggle Heatmap */}
                <div className="flex justify-center mb-4">
                    <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
                        <button onClick={() => setCalendarView('emoji')} className={`px-4 py-1.5 rounded-md text-sm font-medium ${calendarView === 'emoji' ? 'bg-white shadow dark:bg-gray-600' : 'text-gray-600 dark:text-gray-300'}`}>Emoji</button>
                        <button onClick={() => setCalendarView('heatmap')} className={`px-4 py-1.5 rounded-md text-sm font-medium ${calendarView === 'heatmap' ? 'bg-white shadow dark:bg-gray-600' : 'text-gray-600 dark:text-gray-300'}`}>Heatmap</button>
                    </div>
                </div>

                <div id="calendar-grid" className="grid grid-cols-7 gap-0.5 sm:gap-1">
                    {thaiDaysShort.map(day => (
                        <div key={day} className="text-center font-semibold text-gray-500 text-xs sm:text-sm py-2">{day}</div>
                    ))}
                    {emptyCells.map((_, index) => ( <div key={`empty-${index}`}></div> ))}
                    {dayCells.map(day => {
                        const dateString = formatDateYYYYMMDD(new Date(year, month, day));
                        const entry = moodData[dateString];
                        const isToday = dateString === todayCalString;
                        // [v3] Heatmap logic
                        const heatmapColor = entry ? (moodColors[entry.mood] || 'bg-gray-200 dark:bg-gray-600') : 'bg-transparent';
                        const todayClass = isToday ? 'ring-2 ring-emerald-500' : '';

                        return (
                            <div 
                                key={day} 
                                className={`calendar-day text-center py-2 md:py-3 rounded-lg relative cursor-pointer ${todayClass} ${calendarView === 'heatmap' ? '' : 'dark:hover:bg-gray-700 hover:bg-gray-100'}`}
                                title={isToday ? "ไปที่หน้าบันทึก" : `บันทึก/แก้ไข วันที่ ${day}`}
                                onClick={() => handleCalendarDayClick(dateString)}
                            >
                                {calendarView === 'heatmap' ? (
                                    <div className={`h-full w-full rounded-lg ${heatmapColor} opacity-70`}>
                                        <span className={`text-gray-700 dark:text-gray-300 text-xs sm:text-sm relative z-10`}>{day}</span>
                                    </div>
                                ) : (
                                    entry ? (
                                        <img src={moodImageUrls[entry.mood]} alt={entry.mood} className="w-6 h-6 sm:w-8 sm:h-8 mx-auto" />
                                    ) : (
                                        <span className={`text-gray-700 dark:text-gray-300 text-xs sm:text-sm ${isToday ? 'text-emerald-700 dark:text-emerald-100 font-bold' : ''}`}> {day} </span>
                                    )
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderStatsPage = () => (
        // [อัปเดต] เพิ่มคลาส print-area
        <div id="stats-section" className="print-area w-full max-w-md md:max-w-lg lg:max-w-xl mx-auto space-y-6">
            <header className="text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">สถิติอารมณ์</h1>
            </header>

            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg dark:bg-gray-800 grid grid-cols-2 gap-4 text-center">
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">บันทึกต่อเนื่อง</h3>
                    <p className="text-5xl font-bold text-emerald-600 dark:text-emerald-400">{currentStreak}</p>
                    <p className="text-gray-500 dark:text-gray-400">วัน</p>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">ต่อเนื่องสูงสุด</h3>
                    <p className="text-5xl font-bold text-gray-500 dark:text-gray-400">{longestStreak}</p>
                    <p className="text-gray-500 dark:text-gray-400">วัน</p>
                </div>
            </div>

            {/* [v3] Weekly Mood Summary */}
            {weeklyMoodAverage.mood && (
                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg dark:bg-gray-800 text-center">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">อารมณ์เฉลี่ย 7 วัน</h3>
                    <div className="flex justify-center items-center">
                        <img src={moodImageUrls[weeklyMoodAverage.mood]} alt={weeklyMoodAverage.mood} className="w-12 h-12" />
                        <div className="ml-4 text-left">
                            <p className="text-2xl font-bold text-gray-700 dark:text-gray-200">{weeklyMoodAverage.mood}</p>
                            <p className="text-gray-500 dark:text-gray-400">ค่าเฉลี่ย: {weeklyMoodAverage.avg}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg dark:bg-gray-800">
                <h3 className="text-lg sm:text-xl font-semibold mb-6 text-gray-700 dark:text-gray-300">
                    อารมณ์ 30 วันที่ผ่านมา
                </h3>
                {moodStats.total === 0 ? ( <p className="text-center text-gray-500 dark:text-gray-400">ยังไม่มีข้อมูล</p> ) : (
                    <div className="flex h-40 space-x-0.5" title="กราฟอารมณ์ 30 วัน (5=ยอดเยี่ยม, 1=แย่มาก)">
                        {moodChartData.map((data, index) => {
                            const heightPercentage = (data.value / 5) * 100; // 5 คือค่าสูงสุด
                            return (
                                <div key={index} className="flex-1 flex flex-col justify-end group">
                                    <div 
                                        className={`w-full transition-all ${data.value === 0 ? 'bg-gray-200 dark:bg-gray-700' : 'bg-emerald-400'}`}
                                        style={{ height: `${heightPercentage}%` }}
                                        title={`${formatDateThai(data.date)}: ${Object.keys(moodValues).find(key => moodValues[key] === data.value) || 'ไม่ได้บันทึก'}`}
                                    ></div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg dark:bg-gray-800">
                <h3 className="text-lg sm:text-xl font-semibold mb-6 text-gray-700 dark:text-gray-300">
                    ภาพรวมอารมณ์ ({moodStats.total} วัน)
                </h3>
                {moodStats.total === 0 ? ( <p className="text-center text-gray-500 dark:text-gray-400"> ยังไม่มีข้อมูลสถิติ </p> ) : (
                    <div className="space-y-4">
                        {moodKeys.map(mood => (
                            <div key={mood}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium dark:text-gray-200 flex items-center">
                                        <img src={moodImageUrls[mood]} alt={mood} className="w-6 h-6 mr-2" />
                                        {mood}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400"> {moodStats.counts[mood]} วัน ({moodStats.percentages[mood]}%) </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                    <div 
                                        className={`h-2.5 rounded-full ${moodColors[mood] || 'bg-gray-400'}`} 
                                        style={{ width: `${moodStats.percentages[mood]}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

             <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg dark:bg-gray-800">
                <h3 className="text-lg sm:text-xl font-semibold mb-6 text-gray-700 dark:text-gray-300">
                    กิจกรรม & อารมณ์
                </h3>
                {activityMoodStats.length === 0 ? ( <p className="text-center text-gray-500 dark:text-gray-400"> ยังไม่มีการแท็กกิจกรรม </p> ) : (
                    <div className="space-y-4">
                        {activityMoodStats.slice(0, 5).map(stat => ( // แสดง 5 อันดับแรก
                            <div key={stat.activity.id} className="pb-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                                <h4 className="font-semibold mb-2 dark:text-gray-200">{stat.activity.label}</h4>
                                <div className="flex space-x-4">
                                    {stat.counts.slice(0, 3).map(([mood, count]) => ( // 3 อารมณ์แรก
                                        <div key={mood} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                            <img src={moodImageUrls[mood]} alt={mood} className="w-5 h-5 mr-1" />
                                            <span>{count} ครั้ง</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderSettingsPage = () => (
        <div id="settings-section" className="w-full max-w-md md:max-w-lg lg:max-w-xl mx-auto space-y-6">
            
            <header className="text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">ตั้งค่า</h1>
            </header>

            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg dark:bg-gray-800">
                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">ความปลอดภัย</h2>
                {/* [ESLINT FIX]: ลบ prop 'showMessage' ที่ไม่ได้ใช้งาน */}
                <PinSettings appPin={appPin} onSetPin={handleSetPin} />
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg dark:bg-gray-800">
                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">ทั่วไป</h2>
                <div className="space-y-2">
                    
                    {/* [v3] Note Template */}
                    <div className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                        <p className="font-medium text-gray-600 dark:text-gray-300">เทมเพลต "ขอบคุณ"</p>
                        <label htmlFor="template-toggle" className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                id="template-toggle" 
                                className="sr-only peer"
                                checked={useGratitudeTemplate}
                                onChange={() => setUseGratitudeTemplate(prev => !prev)}
                            />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-emerald-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* [ฟีเจอร์ใหม่ v2] จัดการแท็ก */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg dark:bg-gray-800">
                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">จัดการแท็กกิจกรรม</h2>
                <div className="space-y-3 mb-4">
                    {customActivities.map(activity => (
                        <div key={activity.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg dark:bg-gray-700">
                            <span className="dark:text-gray-200">{activity.label}</span>
                            <button
                                onClick={() => handleDeleteCustomActivity(activity.id)}
                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm"
                            >
                                ลบ
                            </button>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="เพิ่มแท็กใหม่ (เช่น ✈️ เที่ยว)"
                        value={newActivityLabel}
                        onChange={(e) => setNewActivityLabel(e.target.value)}
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <button
                        onClick={handleAddCustomActivity}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
                    >
                        เพิ่ม
                    </button>
                </div>
            </div>

            {/* [อัปเดต] จัดการข้อมูล (ลบ JSON/CSV ออก) */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg dark:bg-gray-800">
                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">จัดการข้อมูล</h2>
                <div className="space-y-2">
                    <button 
                        onClick={handlePrintStats}
                        className="w-full text-left p-3 rounded-lg font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                    >
                        ส่งออกสถิติเป็น PDF...
                    </button>

                    <button
                        onClick={handleDeleteAllData}
                        className="w-full text-left p-3 rounded-lg font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
                    >
                        ลบข้อมูลทั้งหมด...
                    </button>
                </div>
            </div>
        </div>
    );

    const renderModal = () => {
        if (!modalData) return null;
        
        // [ESLINT FIX]: ลบ 'entry' ที่ไม่ได้ใช้งาน
        const { dateString } = modalData;

        return (
            <div 
                id="modal" 
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto"
                onClick={handleCloseModal} 
            >
                <div 
                    className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 w-full max-w-md relative dark:bg-gray-800"
                    onClick={(e) => e.stopPropagation()} 
                >
                    <button 
                        id="modal-close-button" 
                        className="absolute top-3 right-3 p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600"
                        onClick={handleCloseModal}
                    >
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                    
                    <h3 id="modal-date" className="text-lg sm:text-xl font-semibold mb-4 dark:text-gray-200">
                        {formatDateThai(dateString)}
                    </h3>
                    
                    {showDeleteConfirmInModal ? (
                        <div className="text-center">
                            <h4 className="font-semibold text-lg dark:text-gray-200 mb-2">ยืนยันการลบ</h4>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?</p>
                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={() => setShowDeleteConfirmInModal(false)}
                                    className="px-6 py-2 rounded-lg font-medium bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={() => handleDeleteEntry(dateString)}
                                    className="px-6 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700"
                                >
                                    ยืนยันลบ
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="max-h-[70vh] overflow-y-auto pr-2">
                            <div className="flex justify-around mb-6">
                                {moodKeys.map(mood => (
                                    <button 
                                        key={mood}
                                        className={`mood-btn p-2 rounded-full transition-all duration-200 ease-in-out border-2 ${
                                            modalEditMood === mood 
                                            ? 'scale-115 border-emerald-500 shadow-[0_4px_10px_rgba(16,185,129,0.3)]' 
                                            : 'border-transparent'
                                        }`}
                                        data-mood={mood} 
                                        title={mood}
                                        onClick={() => setModalEditMood(mood)}
                                    >
                                        <img src={moodImageUrls[mood]} alt={mood} className="w-12 h-12 sm:w-14 sm:h-14" />
                                    </button>
                                ))}
                            </div>

                            {renderActivitySelector(modalEditActivities, (id) => handleActivityToggle(id, true))}

                            {/* Photo Upload ใน Modal */}
                            <div className="mb-4">
                                <label className="block font-medium mb-2 dark:text-gray-300">แนบรูปภาพ (ไม่บังคับ):</label>
                                {!modalEditPhotoData ? (
                                    <label className="w-full flex justify-center items-center px-4 py-3 bg-gray-50 dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                                        <svg className="h-6 w-6 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm16.5-1.5H3.75" />
                                        </svg>
                                        <span>เลือกรูปภาพ (สูงสุด 2MB)</span>
                                        <input 
                                            id="modal-photo-upload-input" 
                                            type="file"
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={(e) => handlePhotoUpload(e, true)}
                                        />
                                    </label>
                                ) : (
                                    <div className="relative group">
                                        <img src={modalEditPhotoData} alt="Preview" className="mt-2 rounded-lg max-h-40 w-auto" />
                                        <button
                                            onClick={() => setModalEditPhotoData(null)}
                                            className="absolute top-0 right-0 m-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="mb-6">
                                <label htmlFor="modal-note-input" className="block font-medium mb-2 dark:text-gray-300">บันทึก:</label>
                                <textarea 
                                    id="modal-note-input" 
                                    rows="5" 
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400" 
                                    placeholder="มีอะไรอยากเล่าไหม..."
                                    value={modalEditNote}
                                    onChange={(e) => setModalEditNote(e.target.value)}
                                />
                                <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1 pr-1">
                                    {modalEditNote.length} ตัวอักษร
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center gap-4 mt-4">
                                {/* [อัปเดต] เปลี่ยนไอคอนปักหมุดเป็นรูปภาพ และคงสีแดงไว้ */}
                                <button 
                                    onClick={() => setModalEditPinned(prev => !prev)}
                                    className={`p-3 rounded-full transition-colors ${modalEditPinned ? 'bg-red-100 text-red-700 dark:bg-red-900' : 'bg-gray-100 text-gray-500 dark:bg-gray-700'}`}
                                    title={modalEditPinned ? "เลิกปักหมุด" : "ปักหมุด"}
                                >
                                    <img 
                                        src="https://gold-brilliant-bonobo-261.mypinata.cloud/ipfs/bafkreig47ahnijdhcwlazvkyz67wcgwwli3f56dvp6q7mdjwpyqvszx3pi" 
                                        alt="Pin Icon" 
                                        className="h-5 w-5" 
                                    />
                                </button>
                                <button 
                                    onClick={handleShareEntry}
                                    className="p-3 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors" 
                                    title="แชร์"
                                >
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25" />
                                    </svg>
                                </button>
                                <button 
                                    onClick={() => setShowDeleteConfirmInModal(true)}
                                    className="p-3 rounded-full text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors" 
                                    title="ลบ"
                                >
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.342.052-.682.107-1.022.166m11.518 0c-2.836.467-5.65.467-8.487 0M17.5 5.79v15m-15-15v15M5.25 6H18.75" />
                                    </svg>
                                </button>
                                
                                <button 
                                    id="modal-save-button" 
                                    className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-semibold shadow-md hover:bg-emerald-700 transition-colors duration-200 disabled:bg-gray-400"
                                    onClick={handleSaveModalEntry}
                                    disabled={!modalEditMood}
                                >
                                    บันทึก
                                </button>
                            </div>
                            
                            {message.visible && (
                                <div className={`mt-4 text-center font-medium ${message.isError ? 'text-red-500' : 'text-green-500'}`}>
                                    {message.text}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderConfirmDeleteAllModal = () => {
        if (!confirmDeleteAllModalVisible) return null;

        return (
            <div 
                id="modal-confirm-delete-all" 
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                onClick={() => setConfirmDeleteAllModalVisible(false)} 
            >
                <div 
                    className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm relative dark:bg-gray-800 text-center"
                    onClick={(e) => e.stopPropagation()} 
                >
                    <h3 className="text-xl font-semibold mb-3 dark:text-gray-200">ยืนยันการลบ</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้
                    </p>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => setConfirmDeleteAllModalVisible(false)}
                            className="px-6 py-2 rounded-lg font-medium bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={performDeleteAllData}
                            className="px-6 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700"
                        >
                            ยืนยันลบทั้งหมด
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderWhatsNewModal = () => {
        if (!showWhatsNew) return null;

        return (
             <div 
                id="modal-whats-new" 
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                onClick={handleCloseWhatsNew} 
            >
                <div 
                    className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg relative dark:bg-gray-800"
                    onClick={(e) => e.stopPropagation()} 
                >
                    <h3 className="text-2xl font-semibold mb-4 text-emerald-600 dark:text-emerald-400">มีอะไรใหม่ใน Feel it!</h3>
                    <div className="max-h-[60vh] overflow-y-auto pr-3 space-y-3 text-gray-700 dark:text-gray-300">
                        <p>เราได้เพิ่มฟีเจอร์ใหม่ๆ มากมายเพื่อช่วยให้คุณติดตามอารมณ์ได้ดียิ่งขึ้น:</p>
                        <ul className="list-disc list-inside space-y-2">
                            {/* [อัปเดต] เปลี่ยนข้อความ */}
                            <li><b>ล็อกแอปด้วย PIN:</b> ตั้งค่า PIN 4 หลักเพื่อล็อกแอปได้ที่หน้า "ตั้งค่า"</li>
                            <li><b>แนบรูปภาพโดยตรง:</b> อัปโหลดรูปภาพ (ไม่เกิน 2MB) จากเครื่องของคุณแทนการใช้ลิงก์</li>
                            <li><b>ปักหมุดบันทึก:</b> กดปุ่มปักหมุดในหน้าแก้ไข และกรองดูเฉพาะบันทึกที่ปักหมุดได้</li>
                            <li><b>"On This Day":</b> ย้อนดูบันทึกเมื่อ 1 ปีที่แล้วได้จากหน้าบันทึกหลัก</li>
                            <li><b>ปฏิทิน Heatmap:</b> สลับมุมมองปฏิทินเป็นแบบ "Heatmap" เพื่อดูภาพรวมสีของอารมณ์</li>
                            <li><b>เทมเพลตโน้ต:</b> เปิดใช้งาน "เทมเพลตขอบคุณ" ในหน้าตั้งค่า</li>
                            <li><b>ส่งออกสถิติเป็น PDF:</b> (ในหน้าตั้งค่า) กดปุ่มเพื่อพิมพ์/บันทึกหน้าสถิติเป็น PDF</li>
                        </ul>
                    </div>
                    <button
                        onClick={handleCloseWhatsNew}
                        className="w-full mt-6 bg-emerald-600 text-white py-3 rounded-lg font-semibold shadow-md hover:bg-emerald-700 transition-colors"
                    >
                        รับทราบ!
                    </button>
                </div>
            </div>
        );
    };

    // [v3] Render PIN Lock Screen
    const renderPinLockScreen = () => (
        // [อัปเดต] เพิ่มคลาส no-print
        <div className="font-kanit-override no-print fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">ใส่รหัส PIN</h2>
            <div className="flex space-x-4 mb-4">
                {[0,1,2,3].map(i => (
                    <div key={i} className={`w-4 h-4 rounded-full ${pinInput.length > i ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                ))}
            </div>
            {pinError && <p className="text-red-500 text-sm mb-4">{pinError}</p>}
            <div className="grid grid-cols-3 gap-4 w-64">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button 
                        key={num} 
                        onClick={() => handlePinInput(num.toString())}
                        className="text-2xl p-4 rounded-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        {num}
                    </button>
                ))}
                <button 
                    onClick={handlePinDelete}
                    className="p-4 rounded-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow hover:bg-gray-50 dark:hover:bg-gray-700 flex justify-center items-center"
                >
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75 14.25 12m0 0 2.25 2.25M14.25 12l2.25-2.25M14.25 12 12 14.25m-2.58 4.92-6.374-6.375a1.125 1.125 0 0 1 0-1.59L9.42 4.83c.21-.21.47-.364.74-.465M12 9.75l-2.58 2.58m-2.58 4.92-6.375-6.375a1.125 1.125 0 0 1 0-1.59L9.42 4.83c.21-.21.47-.364.74-.465M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                </button>
                <button 
                    onClick={() => handlePinInput('0')}
                    className="text-2xl p-4 rounded-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                    0
                </button>
                <button 
                    onClick={handleUnlock}
                    className="p-4 rounded-full bg-emerald-600 text-white shadow hover:bg-emerald-700 flex justify-center items-center"
                >
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m13.5 4.5 6 6m0 0-6 6m6-6h-18" />
                    </svg>
                </button>
            </div>
        </div>
    );

    // --- Main Return ---
    return (
        <> 
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap');
                    .font-kanit-override {
                        font-family: 'Kanit', sans-serif;
                    }
                    
                    /* [อัปเดต] เพิ่มสไตล์สำหรับการพิมพ์ */
                    @media print {
                        .no-print {
                            display: none !important;
                        }
                        main {
                            padding-top: 0 !important;
                        }
                        body, .print-area {
                            background: white !important;
                            color: black !important;
                        }
                        /* ซ่อนทุกหน้า ยกเว้นหน้าที่กำลัง Active */
                        .page-content.page-hidden {
                            display: none !important;
                        }
                        .page-content {
                            display: block !important;
                            visibility: visible !important;
                        }
                        /* ซ่อนปุ่ม Back-to-Top */
                        button[title="กลับไปด้านบน"] {
                            display: none !important;
                        }
                        /* ปรับแต่งหน้าสถิติสำหรับการพิมพ์ */
                        #stats-section {
                            box-shadow: none !important;
                            border: none !important;
                        }
                        #stats-section h1, #stats-section h3 {
                            color: black !important;
                        }
                        #stats-section .bg-white {
                            box-shadow: none !important;
                            border: 1px solid #ccc !important;
                        }
                        #stats-section .text-gray-500 {
                            color: #555 !important;
                        }
                        @page {
                            margin: 1cm;
                            size: A4;
                        }
                    }
                `}
            </style>

            {/* [v3] ตรวจสอบ PIN Lock ก่อน Render แอป */}
            {isLocked ? (
                renderPinLockScreen()
            ) : (
                <div className="font-kanit-override min-h-screen w-screen flex flex-col bg-gray-100 dark:bg-gray-900">
                    
                    {renderNavBar()} 
                    
                    <main className="flex-1 pt-16 relative"> 
                        <div className="container mx-auto p-2 sm:p-4 w-full">
                            <div id="app-content">
                                {currentView === 'entry' && renderEntryPage()}
                                {currentView === 'calendar' && renderCalendarPage()}
                                {currentView === 'stats' && renderStatsPage()} 
                                {currentView === 'settings' && renderSettingsPage()}
                            </div>
                        </div>

                        {showBackToTop && (
                            <button
                                onClick={scrollToTop}
                                // [อัปเดต] เพิ่มคลาส no-print
                                className="no-print fixed bottom-20 right-5 sm:right-10 z-20 p-3 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-opacity duration-300"
                                title="กลับไปด้านบน"
                            >
                                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                                </svg>
                            </button>
                        )}
                    </main>
                    
                    {/* [อัปเดต] เพิ่มคลาส no-print ให้ Modals */}
                    <div className="no-print">
                        {renderModal()}
                        {renderConfirmDeleteAllModal()} 
                        {renderWhatsNewModal()} 
                    </div>
                    
                    {/* [อัปเดต] เพิ่มคลาส no-print */}
                    <footer className="no-print bg-gray-400 text-white p-4 text-center dark:bg-gray-800">
                        © 2025 Feel it App by monadp65
                    </footer>
                </div>
            )}
        </>
    );
}

// [v3] Sub-component สำหรับตั้งค่า PIN
// [ESLINT FIX]: ลบ prop 'showMessage' ที่ไม่ได้ใช้งาน
function PinSettings({ appPin, onSetPin }) {
    const [pin1, setPin1] = useState("");
    const [error, setError] = useState("");

    const handleSavePin = () => {
        setError("");
        if (pin1.length !== 4) {
            setError("PIN ต้องมี 4 หลัก");
            return;
        }
        if (onSetPin(pin1)) {
            setPin1("");
        }
    };

    const handleRemovePin = () => {
        onSetPin(""); // ส่งค่าว่างเพื่อลบ
        setPin1("");
        setError("");
    };

    return (
        <div className="space-y-3">
            <p className="font-medium text-gray-600 dark:text-gray-300">
                {appPin ? "เปลี่ยนรหัส PIN (4 หลัก)" : "ตั้งค่า PIN (4 หลัก)"}
            </p>
            <div className="flex gap-2">
                <input 
                    type="password"
                    maxLength={4}
                    placeholder="ป้อน PIN"
                    value={pin1}
                    onChange={(e) => setPin1(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-2">
                <button
                    onClick={handleSavePin}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
                >
                    {appPin ? "เปลี่ยน PIN" : "ตั้งค่า PIN"}
                </button>
                {appPin && (
                    <button
                        onClick={handleRemovePin}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700"
                    >
                        ยกเลิก PIN
                    </button>
                )}
            </div>
        </div>
    );
}