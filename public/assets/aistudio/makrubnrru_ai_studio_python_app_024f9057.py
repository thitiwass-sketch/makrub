import os
import time
import random
import datetime
import pandas as pd
import streamlit as st
import plotly.graph_objects as go

# ==========================================
# 1. PAGE CONFIGURATION & STYLING
# ==========================================
st.set_page_config(
    page_title="MaKrubNRRU - AI Studio System",
    page_icon="🏫",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for Dark Theme (Slate-950 / Navy & Amber Yellow Accent)
st.markdown("""
<style>
    /* Global Background and Fonts */
    .stApp {
        background-color: #020617;
        color: #f8fafc;
        font-family: 'IBM Plex Sans Thai', 'Prompt', sans-serif;
    }
    
    /* Custom Card Containers */
    .metric-card {
        background-color: #0f172a;
        border: 1px solid #1e293b;
        border-radius: 1rem;
        padding: 1.25rem;
        margin-bottom: 1rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
    }
    
    .metric-title {
        color: #94a3b8;
        font-size: 0.8rem;
        font-weight: 600;
    }
    
    .metric-value {
        color: #fbbf24;
        font-size: 1.8rem;
        font-weight: 800;
        font-family: monospace;
    }
    
    .metric-subtext {
        color: #34d399;
        font-size: 0.75rem;
        font-weight: 500;
    }

    /* AI Insight Box */
    .ai-box {
        background-color: #091e3a;
        border: 1px solid #1e3a8a;
        border-left: 5px solid #38bdf8;
        border-radius: 0.75rem;
        padding: 1rem;
        margin-top: 1rem;
    }

    /* Custom Buttons */
    .stButton>button {
        background-color: #fbbf24 !important;
        color: #020617 !important;
        font-weight: 800 !important;
        border-radius: 0.75rem !important;
        border: none !important;
        transition: all 0.2s ease-in-out;
    }
    .stButton>button:hover {
        background-color: #f59e0b !important;
        transform: scale(1.02);
    }
</style>
""", unsafe_allow_html=True)

# ==========================================
# 2. MOCK DATA & INITIALIZATION
# ==========================================
ANALYTICS_DATA = [
    {"day": "จันทร์", "studentLateMin": 8, "classAvgMin": 12, "threshold": 15, "attendanceRate": 95},
    {"day": "อังคาร", "studentLateMin": 14, "classAvgMin": 10, "threshold": 15, "attendanceRate": 88},
    {"day": "พุธ", "studentLateMin": 22, "classAvgMin": 16, "threshold": 15, "attendanceRate": 82},
    {"day": "พฤหัสบดี", "studentLateMin": 11, "classAvgMin": 9, "threshold": 15, "attendanceRate": 92},
    {"day": "ศุกร์", "studentLateMin": 5, "classAvgMin": 7, "threshold": 15, "attendanceRate": 98},
]

COURSES_DATA = [
    {
        "code": "508117",
        "name": "ปฏิบัติการงานโลหะ (Metalworking Lab)",
        "schedule": "จันทร์ 09:00 - 12:00 น.",
        "room": "โรงงานโลหะ อาคาร 14",
        "instructor": "ผศ.ฐิติวัสส์ กาญจนพิมาย",
        "attendance": "95%",
        "status": "ปกติ (มีสิทธิ์สอบ)"
    },
    {
        "code": "508310",
        "name": "วิทยาการสอนอุตสาหกรรมศิลป์",
        "schedule": "อังคาร 09:00 - 12:00 น.",
        "room": "ห้อง 14.03.02",
        "instructor": "ผศ.ฐิติวัสส์ กาญจนพิมาย",
        "attendance": "100%",
        "status": "ดีเยี่ยม"
    },
    {
        "code": "508355",
        "name": "การเตรียมโครงงานหัตถศิลป์เพื่อชุมชน",
        "schedule": "พฤหัสบดี 09:00 - 12:00 น.",
        "room": "โรงฝึกงานหัตถศิลป์",
        "instructor": "ผศ.ฐิติวัสส์ กาญจนพิมาย",
        "attendance": "88%",
        "status": "สุ่มเสี่ยง"
    }
]

SUBMISSIONS_DATA = [
    {"id": 1, "title": "รายงานการทดลองงานเชื่อมและตัดโลหะ ใบงานที่ 3", "course": "508117", "date": "20 ต.ค. 2569", "status": "อนุมัติผ่านแล้ว", "score": "18/20"},
    {"id": 2, "title": "สรุปทฤษฎีการขึ้นรูปโลหะแผ่นและสัญลักษณ์มาตรฐาน", "course": "508117", "date": "27 ต.ค. 2569", "status": "ส่งแล้ว / รอตรวจ", "score": "-/20"},
    {"id": 3, "title": "แบบเสนอโครงงานอุตสาหกรรมศิลป์เพื่อพัฒนาชุมชน", "course": "508355", "date": "01 พ.ย. 2569", "status": "อนุมัติผ่านแล้ว", "score": "19/20"},
    {"id": 4, "title": "การออกแบบชิ้นงาน 3D CAD ด้วยคอมพิวเตอร์", "course": "508414", "date": "02 พ.ย. 2569", "status": "อนุมัติผ่านแล้ว", "score": "20/20"}
]

# ==========================================
# 3. GOOGLE AI STUDIO (GEMINI API) HELPER
# ==========================================
def call_gemini_ai_studio(api_key: str, data_summary: str) -> str:
    """เรียกใช้ Google AI Studio / Gemini API เพื่อวิเคราะห์พฤติกรรมการเข้าเรียน"""
    if not api_key:
        return "⚠️ กรุณากรอก Google AI Studio API Key ในแถบด้านข้าง (Sidebar) เพื่อเปิดใช้งานระบบวิเคราะห์ AI"
    
    try:
        # ใช้ SDK google-genai หรือ google-generativeai
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        
        # ใช้โมเดล Gemini 2.5 Flash หรือ Gemini 1.5 Flash
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
        คุณคือ AI ผู้ช่วยวิเคราะห์ข้อมูลการเข้าเรียนประจำคณะเทคโนโลยีอุตสาหกรรม มหาวิทยาลัยราชภัฏนครราชสีมา (MaKrubNRRU)
        
        กรุณาวิเคราะห์ข้อมูลสถิติการเข้าเรียนของนักศึกษาจากข้อมูลต่อไปนี้:
        {data_summary}
        
        กรุณาสรุปผลเป็นภาษาไทยด้วยโครงสร้างดังนี้:
        1. 📊 **ภาพรวมพฤติกรรม**: จุดแข็งและวันที่สุ่มเสี่ยงมาสาย
        2. ⚠️ **ปัจจัยเสี่ยง**: การคาดการณ์สิทธิ์สอบและเวลาสายเฉลี่ยเทียบกับเกณฑ์ 15 นาที
        3. 💡 **คำแนะนำผู้สอน**: ข้อเสนอแนะเชิงรุกสำหรับอาจารย์ประจำวิชา
        
        เขียนด้วยสำนวนกระชับ เป็นมืออาชีพ อ่านง่าย
        """
        
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"❌ เกิดข้อผิดพลาดในการเชื่อมต่อ Gemini API: {str(e)}"

# ==========================================
# 4. SIDEBAR NAVIGATION & CONTROLS
# ==========================================
with st.sidebar:
    st.image("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150", width=70)
    st.markdown("### **MaKrubNRRU System**")
    st.caption("ระบบเช็คชื่อ & Analytics คณะเทคโนโลยีอุตสาหกรรม NRRU")
    
    st.divider()
    
    # API Key Input
    user_api_key = st.text_input("🔑 Google AI Studio API Key", type="password", help="ใส่ API Key จาก Google AI Studio เพื่อเปิดใช้ AI Insights")
    
    # Role Selector
    user_role = st.selectbox("👤 สิทธิ์การใช้งาน (Role)", ["นักศึกษา (Student)", "อาจารย์ผู้สอน (Instructor/Admin)"])
    
    st.divider()
    
    # Menu Navigation
    menu = st.radio(
        "📌 เมนูหลัก",
        ["แดชบอร์ด & AI Analytics", "รายวิชาของฉัน", "Dynamic QR Code เช็คชื่อ", "รายการส่งงาน & โครงการ"]
    )
    
    st.caption("🔒 NRRU Single Sign-On Verified")

# ==========================================
# 5. MAIN CONTENT ROUTING
# ==========================================

# HEADER BAR
col_h1, col_h2 = st.columns([3, 1])
with col_h1:
    st.title("🏫 MaKrubNRRU")
    st.caption("สาขาวิชาอุตสาหกรรมศิลป์ คณะเทคโนโลยีอุตสาหกรรม มหาวิทยาลัยราชภัฏนครราชสีมา")
with col_h2:
    st.markdown("<br>", unsafe_allow_html=True)
    st.info(f"**ผู้ใช้:** นายสมชาย ใจดี\n\n**สิทธิ์:** {user_role}")

st.divider()

# ------------------------------------------
# TAB 1: DASHBOARD & AI ANALYTICS
# ------------------------------------------
if menu == "แดชบอร์ด & AI Analytics":
    st.subheader("📈 ภาพรวมสถิติ & การวิเคราะห์ด้วย AI (Google AI Studio)")
    
    # Key Metrics Row
    m1, m2, m3, m4 = st.columns(4)
    with m1:
        st.markdown("""
        <div class="metric-card">
            <div class="metric-title">เข้าเรียนตรงเวลา</div>
            <div class="metric-value">94.2%</div>
            <div class="metric-subtext">▲ +2.4% จากสัปดาห์ก่อน</div>
        </div>
        """, unsafe_allow_html=True)
    with m2:
        st.markdown("""
        <div class="metric-card">
            <div class="metric-title">เวลาสายเฉลี่ย</div>
            <div class="metric-value">11 นาที</div>
            <div class="metric-subtext">🟢 ต่ำกว่าเกณฑ์สาย (15 นาที)</div>
        </div>
        """, unsafe_allow_html=True)
    with m3:
        st.markdown("""
        <div class="metric-card">
            <div class="metric-title">สถานะสิทธิ์สอบ</div>
            <div class="metric-value" style="color: #34d399;">ปกติ (100%)</div>
            <div class="metric-subtext">ขาด 0 ครั้ง จากโควตา 3 ครั้ง</div>
        </div>
        """, unsafe_allow_html=True)
    with m4:
        st.markdown("""
        <div class="metric-card">
            <div class="metric-title">งานที่อนุมัติแล้ว</div>
            <div class="metric-value">3 / 4 ชิ้น</div>
            <div class="metric-subtext" style="color: #38bdf8;">รอตรวจ 1 ชิ้นงาน</div>
        </div>
        """, unsafe_allow_html=True)

    # Plotly Analytics Chart
    st.markdown("#### 📊 กราฟเปรียบเทียบเวลาสายเฉลี่ย (รายวัน)")
    df = pd.DataFrame(ANALYTICS_DATA)
    
    fig = go.Figure()
    fig.add_trace(go.Bar(
        x=df['day'], 
        y=df['studentLateMin'],
        name='นาทีที่สายของคุณ',
        marker_color='#fbbf24'
    ))
    fig.add_trace(go.Scatter(
        x=df['day'], 
        y=df['classAvgMin'],
        name='เฉลี่ยกลุ่มเรียน',
        line=dict(color='#38bdf8', width=3),
        mode='lines+markers'
    ))
    # Threshold Line
    fig.add_hline(y=15, line_dash="dash", line_color="#f43f5e", annotation_text="เกณฑ์สายสุ่มเสี่ยง (15m)")
    
    fig.update_layout(
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(15,23,42,0.6)',
        font=dict(color='#cbd5e1'),
        margin=dict(l=20, r=20, t=30, b=20),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
    )
    st.plotly_chart(fig, use_container_width=True)

    # AI Insights Engine (Google AI Studio)
    st.markdown("#### ✨ AI Real-Time Insights (Powered by Gemini API)")
    
    if st.button("🤖 ประมวลผลและวิเคราะห์สถิติด้วย Gemini AI"):
        data_summary_text = df.to_string(index=False)
        with st.spinner("กำลังเชื่อมต่อ Google AI Studio เพื่อประมวลผลข้อมูล..."):
            ai_result = call_gemini_ai_studio(user_api_key, data_summary_text)
            st.markdown(f"""
            <div class="ai-box">
                {ai_result}
            </div>
            """, unsafe_allow_html=True)
    else:
        st.info("💡 คลิกปุ่มด้านบนเพื่อส่งข้อมูลสถิติเข้าประมวลผลผ่าน Gemini API (Google AI Studio)")

# ------------------------------------------
# TAB 2: COURSES MANAGEMENT
# ------------------------------------------
elif menu == "รายวิชาของฉัน":
    st.subheader("📚 รายวิชาที่ลงทะเบียนในภาคการศึกษา 1/2569")
    
    c1, c2 = st.columns([2, 1])
    with c1:
        search = st.text_input("🔍 ค้นหารายวิชา (รหัสวิชา หรือ ชื่อวิชา)", "")
    with c2:
        st.markdown("<br>", unsafe_allow_html=True)
        if st.button("🔑 + เข้าร่วมด้วย Passcode"):
            st.success("กรอก Passcode เพื่อเข้าร่วมรายวิชาใหม่สำเร็จ!")

    # Display Courses Cards Grid
    cols = st.columns(3)
    for idx, course in enumerate(COURSES_DATA):
        if search.lower() in course['code'].lower() or search.lower() in course['name'].lower():
            with cols[idx % 3]:
                st.markdown(f"""
                <div class="metric-card">
                    <span style="background-color: #1e293b; color: #fbbf24; padding: 0.2rem 0.6rem; border-radius: 0.5rem; font-size: 0.75rem; font-weight: 700;">{course['code']}</span>
                    <h4 style="color: #ffffff; margin-top: 0.5rem; font-size: 1rem;">{course['name']}</h4>
                    <p style="color: #94a3b8; font-size: 0.8rem;"><b>ผู้สอน:</b> {course['instructor']}</p>
                    <p style="color: #94a3b8; font-size: 0.75rem;">⏰ {course['schedule']}<br>📍 {course['room']}</p>
                    <hr style="border-color: #1e293b;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem;">
                        <span>เข้าเรียน: <b>{course['attendance']}</b></span>
                        <span style="color: #34d399; font-weight: 700;">{course['status']}</span>
                    </div>
                </div>
                """, unsafe_allow_html=True)

# ------------------------------------------
# TAB 3: DYNAMIC QR CODE SCANNER
# ------------------------------------------
elif menu == "Dynamic QR Code เช็คชื่อ":
    st.subheader("📲 ระบบเช็คชื่อ Dynamic QR Code แบบเรียลไทม์")
    
    col_qr1, col_qr2 = st.columns([1, 2])
    with col_qr1:
        st.markdown("""
        <div style="background-color: #ffffff; padding: 1.5rem; border-radius: 1.5rem; text-align: center; border: 4px solid #fbbf24;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=MK-NRRU-TOKEN-88F92A" width="180">
        </div>
        """, unsafe_allow_html=True)
    with col_qr2:
        st.markdown("### วิชา 508117 ปฏิบัติการงานโลหะ")
        st.write("📍 **สถานที่:** โรงงานโลหะ อาคาร 14")
        st.write("⏰ **เวลา:** จันทร์ 09:00 - 12:00 น.")
        st.warning("⏱️ Dynamic Token รีเฟรชอัตโนมัติทุก 15 วินาที เพื่อป้องกันการเช็คชื่อแทนกัน")
        
        if st.button("📸 จำลองสแกน QR Code เช็คชื่อ"):
            st.balloons()
            st.success("✅ เช็คชื่อเข้าเรียนสำเร็จ! เวลาบันทึก: 08:58 น. (ตรงเวลา)")

# ------------------------------------------
# TAB 4: SUBMISSIONS & EXPORT
# ------------------------------------------
elif menu == "รายการส่งงาน & โครงการ":
    st.subheader("📂 รายการส่งงานและโครงงานประจำภาคเรียน")
    
    df_sub = pd.DataFrame(SUBMISSIONS_DATA)
    st.dataframe(df_sub, use_container_width=True)
    
    st.divider()
    
    # Export Data via CSV
    csv_data = df_sub.to_csv(index=False).encode('utf-8-sig')
    st.download_button(
        label="📥 ส่งออกรายการส่งงานเป็นไฟล์ CSV (Excel Ready)",
        data=csv_data,
        file_name=f"MaKrubNRRU_Submissions_{datetime.date.today()}.csv",
        mime="text/csv"
    )

# FOOTER
st.markdown("<br><hr>", unsafe_allow_html=True)
st.caption("© 2026 MaKrubNRRU • คณะเทคโนโลยีอุตสาหกรรม มหาวิทยาลัยราชภัฏนครราชสีมา | Google AI Studio Compatible")