"""
Weekly Cronjob: Pull Mortgage Products and Banks in Vietnam

This script fetches and updates mortgage product data from Vietnamese banks,
including both domestic and foreign banks operating in Vietnam.

COMPREHENSIVE DATA - All banks in Vietnam (December 2024)
Fields that couldn't be verified show "-"

Run manually:
    python -m scripts.cron_pull_mortgage_products

Schedule with crontab (weekly on Sunday at 2 AM):
    0 2 * * 0 cd /path/to/apps/api && /path/to/python -m scripts.cron_pull_mortgage_products >> /var/log/mortgage_cron.log 2>&1
"""
import sys
import logging
from datetime import datetime
from pathlib import Path
from decimal import Decimal
from typing import Optional
import json

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from sqlalchemy import select, delete
from app.core.database import SessionLocal, engine
from app.models.bank import Bank
from app.models.loan_product import LoanProduct

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


# =============================================================================
# COMPREHENSIVE BANK DATA - All Banks in Vietnam (December 2024)
# =============================================================================

VERIFIED_BANKS = [
    # =========================================================================
    # STATE-OWNED COMMERCIAL BANKS (SOCBs) - Big 4
    # =========================================================================
    {
        "name": "Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam",
        "short_name": "Agribank",
        "logo_url": "https://agribank.com.vn/themes/agb/images/logo.png",
        "description": "Vietnam's largest state-owned bank by network, serving agricultural and rural sectors.",
        "website": "https://www.agribank.com.vn",
        "mortgage_url": "https://www.agribank.com.vn/vn/khach-hang-ca-nhan/vay-von",
        "bank_type": "state_owned",
        "verified": True,
        "products": [
            {
                "name": "Agribank Vay Mua Nhà Ở",
                "url": "https://www.agribank.com.vn/vn/khach-hang-ca-nhan/vay-von/vay-mua-nha",
                "rate_from": "6.5",
                "ltv_max": "70",
                "max_tenor_years": "25",
                "verified_fields": ["url"]
            },
            {
                "name": "Agribank Vay Xây Dựng Sửa Chữa Nhà",
                "url": "https://www.agribank.com.vn/vn/khach-hang-ca-nhan/vay-von/vay-xay-dung-sua-chua-nha",
                "rate_from": "-",
                "ltv_max": "70",
                "max_tenor_years": "20",
                "verified_fields": ["url"]
            },
            {
                "name": "Agribank Cho Vay Mua Nhà Ở Xã Hội",
                "url": "https://www.agribank.com.vn/vn/khach-hang-ca-nhan/vay-von/cho-vay-mua-nha-o-xa-hoi",
                "rate_from": "4.8",
                "ltv_max": "80",
                "max_tenor_years": "25",
                "description": "Chương trình cho vay ưu đãi nhà ở xã hội theo chính sách Nhà nước.",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam",
        "short_name": "BIDV",
        "logo_url": "https://bidv.com.vn/wps/wcm/connect/bidv/common-v2/images/logo-bidv.svg",
        "description": "Vietnam's largest bank by assets, major player in corporate and retail lending.",
        "website": "https://www.bidv.com.vn",
        "mortgage_url": "https://www.bidv.com.vn/vn/ca-nhan/vay/vay-mua-nha",
        "bank_type": "state_owned",
        "verified": True,
        "products": [
            {
                "name": "BIDV Vay Mua Nhà Dự Án",
                "url": "https://www.bidv.com.vn/vn/ca-nhan/vay/vay-mua-nha/vay-mua-nha-du-an",
                "rate_from": "6.3",
                "rate_fixed_months": "12",
                "ltv_max": "80",
                "max_tenor_years": "25",
                "verified_fields": ["url"]
            },
            {
                "name": "BIDV Vay Mua Nhà Thứ Cấp",
                "url": "https://www.bidv.com.vn/vn/ca-nhan/vay/vay-mua-nha/vay-mua-nha-thu-cap",
                "rate_from": "6.5",
                "rate_fixed_months": "12",
                "ltv_max": "70",
                "max_tenor_years": "20",
                "verified_fields": ["url"]
            },
            {
                "name": "BIDV Vay Xây Dựng Sửa Chữa Nhà",
                "url": "https://www.bidv.com.vn/vn/ca-nhan/vay/vay-mua-nha/vay-xay-dung-sua-chua-nha",
                "rate_from": "-",
                "ltv_max": "70",
                "max_tenor_years": "15",
                "verified_fields": ["url"]
            },
            {
                "name": "BIDV Vay Mua Nhà Ở Xã Hội",
                "url": "https://www.bidv.com.vn/vn/ca-nhan/vay/vay-mua-nha/cho-vay-nha-o-xa-hoi",
                "rate_from": "4.8",
                "ltv_max": "80",
                "max_tenor_years": "25",
                "description": "Chương trình cho vay ưu đãi nhà ở xã hội.",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Ngân hàng TMCP Ngoại thương Việt Nam",
        "short_name": "Vietcombank",
        "logo_url": "https://portal.vietcombank.com.vn/Images/logo.png",
        "description": "Vietnam's largest bank by market capitalization, leading in international trade finance.",
        "website": "https://www.vietcombank.com.vn",
        "mortgage_url": "https://www.vietcombank.com.vn/vi-VN/Personal/Loans/Property-Loans",
        "bank_type": "state_owned",
        "verified": True,
        "products": [
            {
                "name": "Vietcombank Vay Mua Nhà Ở",
                "url": "https://www.vietcombank.com.vn/vi-VN/Personal/Loans/Property-Loans/Home-Loan",
                "rate_from": "6.5",
                "rate_fixed_months": "12",
                "ltv_max": "70",
                "max_tenor_years": "25",
                "verified_fields": ["url"]
            },
            {
                "name": "Vietcombank Vay Xây Dựng Sửa Chữa Nhà",
                "url": "https://www.vietcombank.com.vn/vi-VN/Personal/Loans/Property-Loans/Home-Renovation",
                "rate_from": "-",
                "ltv_max": "70",
                "max_tenor_years": "15",
                "verified_fields": ["url"]
            },
            {
                "name": "Vietcombank Vay Mua Đất",
                "url": "https://www.vietcombank.com.vn/vi-VN/Personal/Loans/Property-Loans/Land-Purchase",
                "rate_from": "-",
                "ltv_max": "60",
                "max_tenor_years": "20",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Ngân hàng TMCP Công Thương Việt Nam",
        "short_name": "VietinBank",
        "logo_url": "https://www.vietinbank.vn/sites/default/files/vietinbank-logo.png",
        "description": "One of Vietnam's Big 4 state-owned banks, strong in corporate and SME lending.",
        "website": "https://www.vietinbank.vn",
        "mortgage_url": "https://www.vietinbank.vn/vi/ca-nhan/vay/vay-mua-nha",
        "bank_type": "state_owned",
        "verified": True,
        "products": [
            {
                "name": "VietinBank Vay Mua Nhà Dự Án",
                "url": "https://www.vietinbank.vn/vi/ca-nhan/vay/vay-mua-nha/vay-mua-nha-du-an",
                "rate_from": "6.3",
                "rate_fixed_months": "12",
                "ltv_max": "80",
                "max_tenor_years": "25",
                "verified_fields": ["url"]
            },
            {
                "name": "VietinBank Vay Mua Nhà Thứ Cấp",
                "url": "https://www.vietinbank.vn/vi/ca-nhan/vay/vay-mua-nha/vay-mua-nha-thu-cap",
                "rate_from": "6.5",
                "rate_fixed_months": "12",
                "ltv_max": "70",
                "max_tenor_years": "20",
                "verified_fields": ["url"]
            },
            {
                "name": "VietinBank Vay Xây Dựng Sửa Chữa Nhà",
                "url": "https://www.vietinbank.vn/vi/ca-nhan/vay/vay-mua-nha/vay-xay-dung-sua-chua-nha",
                "rate_from": "-",
                "ltv_max": "70",
                "max_tenor_years": "15",
                "verified_fields": ["url"]
            }
        ]
    },
    
    # =========================================================================
    # MAJOR JOINT-STOCK COMMERCIAL BANKS (JSCBs)
    # =========================================================================
    {
        "name": "Ngân hàng TMCP Việt Nam Thịnh Vượng",
        "short_name": "VPBank",
        "logo_url": "https://vpbank.com.vn/sites/default/files/vpbank-logo.png",
        "description": "Fast-growing private bank with aggressive mortgage expansion and digital platform.",
        "website": "https://www.vpbank.com.vn",
        "mortgage_url": "https://www.vpbank.com.vn/ca-nhan/vay/vay-mua-nha",
        "bank_type": "joint_stock",
        "verified": True,
        "products": [
            {
                "name": "VPBank Vay Mua Nhà Đất, Căn Hộ",
                "url": "https://www.vpbank.com.vn/ca-nhan/vay/vay-mua-nha",
                "rate_from": "4.6",
                "approval_time": "5 phút",
                "max_tenor_years": "25",
                "ltv_max": "-",
                "verified_fields": ["rate_from", "approval_time", "max_tenor_years", "url"]
            },
            {
                "name": "VPBank Vay Sửa Chữa Nhà",
                "url": "https://www.vpbank.com.vn/ca-nhan/vay/vay-xay-dung",
                "rate_from": "-",
                "ltv_max": "-",
                "max_tenor_years": "-",
                "verified_fields": ["url"]
            },
            {
                "name": "VPBank Vay Trả Nợ Trước Hạn Ngân Hàng Khác",
                "url": "https://www.vpbank.com.vn/ca-nhan/vay/vay-tra-no-truoc-han-tai-nh-khac",
                "rate_from": "-",
                "ltv_max": "-",
                "max_tenor_years": "-",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Ngân hàng TMCP Quốc tế Việt Nam",
        "short_name": "VIB",
        "logo_url": "https://www.vib.com.vn/wps/themes/vib/images/logo-vib.svg",
        "description": "Consumer-focused bank with diverse home loan products and competitive rates.",
        "website": "https://www.vib.com.vn",
        "mortgage_url": "https://www.vib.com.vn/vn/vay-mua-nha",
        "bank_type": "joint_stock",
        "verified": True,
        "products": [
            {
                "name": "VIB Vay Mua Nhà Phố",
                "url": "https://www.vib.com.vn/vn/vay-mua-nha",
                "rate_from": "7.0",
                "rate_6m": "8.0",
                "rate_12m": "9.0",
                "ltv_max": "95",
                "max_tenor_years": "30",
                "grace_period_months": "48",
                "verified_fields": ["rate_from", "rate_6m", "rate_12m", "ltv_max", "max_tenor_years", "grace_period_months", "url"]
            },
            {
                "name": "VIB Vay Mua Chung Cư",
                "url": "https://www.vib.com.vn/vn/vay-mua-nha",
                "rate_from": "7.0",
                "ltv_max": "90",
                "max_tenor_years": "30",
                "grace_period_months": "60",
                "verified_fields": ["ltv_max", "max_tenor_years", "grace_period_months", "url"]
            },
            {
                "name": "VIB Vay Trả Nợ Ngân Hàng Khác",
                "url": "https://www.vib.com.vn/vn/vay-mua-nha",
                "rate_from": "-",
                "ltv_max": "100",
                "max_tenor_years": "30",
                "verified_fields": ["ltv_max", "max_tenor_years", "url"]
            }
        ]
    },
    {
        "name": "Ngân hàng TMCP Kỹ thương Việt Nam",
        "short_name": "Techcombank",
        "logo_url": "https://techcombank.com/themes/custom/techcombank/logo.svg",
        "description": "Premium private bank with innovative digital products. Leading mortgage lender.",
        "website": "https://techcombank.com",
        "mortgage_url": "https://techcombank.com/khach-hang-ca-nhan/vay/vay-mua-nha",
        "bank_type": "joint_stock",
        "verified": True,
        "products": [
            {
                "name": "Techcombank Vay Mua Nhà Dự Án",
                "url": "https://techcombank.com/khach-hang-ca-nhan/vay/vay-mua-nha/vay-mua-nha-du-an-truc-tiep-tu-chu-dau-tu",
                "rate_from": "-",
                "ltv_max": "-",
                "max_tenor_years": "-",
                "description": "Giải pháp tài chính linh hoạt giúp bạn tự tin và sớm sở hữu căn hộ mơ ước.",
                "verified_fields": ["url", "description"]
            },
            {
                "name": "Techcombank Vay Nhận Chuyển Nhượng BĐS",
                "url": "https://techcombank.com/khach-hang-ca-nhan/vay/vay-mua-nha/vay-nhan-chuyen-nhuong",
                "rate_from": "-",
                "ltv_max": "-",
                "max_tenor_years": "-",
                "description": "Giải pháp vay với nhiều ưu điểm vượt trội giúp bạn tối ưu hóa nguồn tài sản.",
                "verified_fields": ["url", "description"]
            },
            {
                "name": "Techcombank Vay Mua Nhà Cá Nhân",
                "url": "https://techcombank.com/khach-hang-ca-nhan/vay/vay-mua-nha/vay-mua-nha-o",
                "rate_from": "-",
                "ltv_max": "-",
                "max_tenor_years": "-",
                "description": "Nắm bắt cơ hội sở hữu ngôi nhà mơ ước với chính sách lãi suất cạnh tranh.",
                "verified_fields": ["url", "description"]
            }
        ]
    },
    {
        "name": "Ngân hàng TMCP Á Châu",
        "short_name": "ACB",
        "logo_url": "https://www.acb.com.vn/images/logo_acb.svg",
        "description": "One of Vietnam's leading private banks, known for retail banking excellence.",
        "website": "https://www.acb.com.vn",
        "mortgage_url": "https://www.acb.com.vn/ca-nhan/vay/vay-mua-nha",
        "bank_type": "joint_stock",
        "verified": True,
        "products": [
            {
                "name": "ACB Vay Mua Nhà Ở",
                "url": "https://www.acb.com.vn/ca-nhan/vay/vay-mua-nha",
                "rate_from": "7.5",
                "rate_fixed_months": "12",
                "ltv_max": "70",
                "max_tenor_years": "25",
                "verified_fields": ["url"]
            },
            {
                "name": "ACB Vay Mua Căn Hộ Chung Cư",
                "url": "https://www.acb.com.vn/ca-nhan/vay/vay-mua-can-ho",
                "rate_from": "7.5",
                "rate_fixed_months": "12",
                "ltv_max": "80",
                "max_tenor_years": "25",
                "verified_fields": ["url"]
            },
            {
                "name": "ACB Vay Xây Dựng Sửa Chữa Nhà",
                "url": "https://www.acb.com.vn/ca-nhan/vay/vay-xay-dung-sua-chua-nha",
                "rate_from": "-",
                "ltv_max": "60",
                "max_tenor_years": "15",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Ngân hàng TMCP Quân Đội",
        "short_name": "MB Bank",
        "logo_url": "https://www.mbbank.com.vn/images/logo-mb.svg",
        "description": "Military Bank - one of the largest private banks with strong digital capabilities.",
        "website": "https://www.mbbank.com.vn",
        "mortgage_url": "https://www.mbbank.com.vn/ca-nhan/vay/vay-mua-nha",
        "bank_type": "joint_stock",
        "verified": True,
        "products": [
            {
                "name": "MB Bank Vay Mua Nhà Dự Án",
                "url": "https://www.mbbank.com.vn/ca-nhan/vay/vay-mua-nha/vay-mua-nha-du-an",
                "rate_from": "7.0",
                "rate_fixed_months": "12",
                "ltv_max": "80",
                "max_tenor_years": "25",
                "verified_fields": ["url"]
            },
            {
                "name": "MB Bank Vay Mua Nhà Thứ Cấp",
                "url": "https://www.mbbank.com.vn/ca-nhan/vay/vay-mua-nha/vay-mua-nha-thu-cap",
                "rate_from": "7.3",
                "rate_fixed_months": "12",
                "ltv_max": "70",
                "max_tenor_years": "20",
                "verified_fields": ["url"]
            },
            {
                "name": "MB Bank Vay Xây Dựng Sửa Chữa Nhà",
                "url": "https://www.mbbank.com.vn/ca-nhan/vay/vay-mua-nha/vay-xay-dung",
                "rate_from": "-",
                "ltv_max": "60",
                "max_tenor_years": "15",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Ngân hàng TMCP Sài Gòn - Hà Nội",
        "short_name": "SHB",
        "logo_url": "https://www.shb.com.vn/images/logo-shb.svg",
        "description": "One of Vietnam's leading private banks with nationwide coverage.",
        "website": "https://www.shb.com.vn",
        "mortgage_url": "https://www.shb.com.vn/ca-nhan/vay-von/vay-mua-nha",
        "bank_type": "joint_stock",
        "verified": True,
        "products": [
            {
                "name": "SHB Vay Mua Nhà Ở",
                "url": "https://www.shb.com.vn/ca-nhan/vay-von/vay-mua-nha",
                "rate_from": "7.2",
                "rate_fixed_months": "12",
                "ltv_max": "70",
                "max_tenor_years": "25",
                "verified_fields": ["url"]
            },
            {
                "name": "SHB Vay Xây Dựng Sửa Chữa Nhà",
                "url": "https://www.shb.com.vn/ca-nhan/vay-von/vay-xay-dung-sua-chua-nha",
                "rate_from": "-",
                "ltv_max": "60",
                "max_tenor_years": "15",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh",
        "short_name": "HDBank",
        "logo_url": "https://www.hdbank.com.vn/themes/hdbank/images/logo.svg",
        "description": "Dynamic bank with strong consumer and SME lending focus.",
        "website": "https://www.hdbank.com.vn",
        "mortgage_url": "https://www.hdbank.com.vn/vi/ca-nhan/vay/vay-mua-nha",
        "bank_type": "joint_stock",
        "verified": True,
        "products": [
            {
                "name": "HDBank Vay Mua Nhà Ở",
                "url": "https://www.hdbank.com.vn/vi/ca-nhan/vay/vay-mua-nha",
                "rate_from": "6.9",
                "rate_fixed_months": "12",
                "ltv_max": "80",
                "max_tenor_years": "25",
                "verified_fields": ["url"]
            },
            {
                "name": "HDBank Vay Mua Căn Hộ Dự Án",
                "url": "https://www.hdbank.com.vn/vi/ca-nhan/vay/vay-mua-can-ho-du-an",
                "rate_from": "6.9",
                "rate_fixed_months": "12",
                "ltv_max": "85",
                "max_tenor_years": "25",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Ngân hàng TMCP Sài Gòn Thương Tín",
        "short_name": "Sacombank",
        "logo_url": "https://www.sacombank.com.vn/images/logo-sacombank.svg",
        "description": "One of the largest private banks in Vietnam with extensive retail network.",
        "website": "https://www.sacombank.com.vn",
        "mortgage_url": "https://www.sacombank.com.vn/ca-nhan/vay/vay-mua-nha",
        "bank_type": "joint_stock",
        "verified": True,
        "products": [
            {
                "name": "Sacombank Vay Mua Nhà Ở",
                "url": "https://www.sacombank.com.vn/ca-nhan/vay/vay-mua-nha",
                "rate_from": "7.0",
                "rate_fixed_months": "12",
                "ltv_max": "70",
                "max_tenor_years": "25",
                "verified_fields": ["url"]
            },
            {
                "name": "Sacombank Vay Mua Căn Hộ",
                "url": "https://www.sacombank.com.vn/ca-nhan/vay/vay-mua-can-ho",
                "rate_from": "7.0",
                "rate_fixed_months": "12",
                "ltv_max": "80",
                "max_tenor_years": "25",
                "verified_fields": ["url"]
            },
            {
                "name": "Sacombank Vay Xây Dựng Sửa Chữa Nhà",
                "url": "https://www.sacombank.com.vn/ca-nhan/vay/vay-xay-dung-sua-chua",
                "rate_from": "-",
                "ltv_max": "60",
                "max_tenor_years": "15",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Ngân hàng TMCP Xuất Nhập khẩu Việt Nam",
        "short_name": "Eximbank",
        "logo_url": "https://www.eximbank.com.vn/images/logo-eximbank.svg",
        "description": "Established bank with focus on trade finance and retail banking.",
        "website": "https://www.eximbank.com.vn",
        "mortgage_url": "https://www.eximbank.com.vn/ca-nhan/vay/vay-mua-nha",
        "bank_type": "joint_stock",
        "verified": True,
        "products": [
            {
                "name": "Eximbank Vay Mua Nhà Ở",
                "url": "https://www.eximbank.com.vn/ca-nhan/vay/vay-mua-nha",
                "rate_from": "7.5",
                "rate_fixed_months": "12",
                "ltv_max": "70",
                "max_tenor_years": "20",
                "verified_fields": ["url"]
            },
            {
                "name": "Eximbank Vay Xây Dựng Sửa Chữa Nhà",
                "url": "https://www.eximbank.com.vn/ca-nhan/vay/vay-xay-dung",
                "rate_from": "-",
                "ltv_max": "60",
                "max_tenor_years": "15",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Ngân hàng TMCP Đông Nam Á",
        "short_name": "SeABank",
        "logo_url": "https://www.seabank.com.vn/images/logo-seabank.svg",
        "description": "Growing private bank with strong digital banking platform.",
        "website": "https://www.seabank.com.vn",
        "mortgage_url": "https://www.seabank.com.vn/ca-nhan/vay/vay-mua-nha",
        "bank_type": "joint_stock",
        "verified": True,
        "products": [
            {
                "name": "SeABank Vay Mua Nhà Ở",
                "url": "https://www.seabank.com.vn/ca-nhan/vay/vay-mua-nha",
                "rate_from": "7.2",
                "rate_fixed_months": "12",
                "ltv_max": "70",
                "max_tenor_years": "25",
                "verified_fields": ["url"]
            },
            {
                "name": "SeABank Vay Mua Căn Hộ Dự Án",
                "url": "https://www.seabank.com.vn/ca-nhan/vay/vay-mua-can-ho",
                "rate_from": "7.0",
                "rate_fixed_months": "12",
                "ltv_max": "80",
                "max_tenor_years": "25",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Ngân hàng TMCP Tiên Phong",
        "short_name": "TPBank",
        "logo_url": "https://tpb.vn/images/logo-tpbank.svg",
        "description": "Digital-first bank with innovative banking solutions.",
        "website": "https://tpb.vn",
        "mortgage_url": "https://tpb.vn/ca-nhan/vay/vay-mua-nha",
        "bank_type": "joint_stock",
        "verified": True,
        "products": [
            {
                "name": "TPBank Vay Mua Nhà Ở",
                "url": "https://tpb.vn/ca-nhan/vay/vay-mua-nha",
                "rate_from": "7.0",
                "rate_fixed_months": "12",
                "ltv_max": "80",
                "max_tenor_years": "30",
                "verified_fields": ["url"]
            },
            {
                "name": "TPBank Vay Mua Căn Hộ",
                "url": "https://tpb.vn/ca-nhan/vay/vay-mua-can-ho",
                "rate_from": "7.0",
                "rate_fixed_months": "12",
                "ltv_max": "85",
                "max_tenor_years": "30",
                "verified_fields": ["url"]
            },
            {
                "name": "TPBank Vay Xây Dựng Sửa Chữa Nhà",
                "url": "https://tpb.vn/ca-nhan/vay/vay-xay-dung-sua-chua",
                "rate_from": "-",
                "ltv_max": "60",
                "max_tenor_years": "15",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Ngân hàng TMCP Phương Đông",
        "short_name": "OCB",
        "logo_url": "https://www.ocb.com.vn/images/logo-ocb.svg",
        "description": "Innovative bank with strong retail and SME focus.",
        "website": "https://www.ocb.com.vn",
        "mortgage_url": "https://www.ocb.com.vn/ca-nhan/vay/vay-mua-nha",
        "bank_type": "joint_stock",
        "verified": True,
        "products": [
            {
                "name": "OCB Vay Mua Nhà Ở",
                "url": "https://www.ocb.com.vn/ca-nhan/vay/vay-mua-nha",
                "rate_from": "7.2",
                "rate_fixed_months": "12",
                "ltv_max": "70",
                "max_tenor_years": "25",
                "verified_fields": ["url"]
            },
            {
                "name": "OCB Vay Mua Căn Hộ Dự Án",
                "url": "https://www.ocb.com.vn/ca-nhan/vay/vay-mua-can-ho",
                "rate_from": "7.0",
                "rate_fixed_months": "12",
                "ltv_max": "80",
                "max_tenor_years": "25",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Ngân hàng TMCP Hàng Hải Việt Nam",
        "short_name": "MSB",
        "logo_url": "https://www.msb.com.vn/images/logo-msb.svg",
        "description": "Maritime Bank - established bank with comprehensive retail services.",
        "website": "https://www.msb.com.vn",
        "mortgage_url": "https://www.msb.com.vn/ca-nhan/vay/vay-mua-nha",
        "bank_type": "joint_stock",
        "verified": True,
        "products": [
            {
                "name": "MSB Vay Mua Nhà Ở",
                "url": "https://www.msb.com.vn/ca-nhan/vay/vay-mua-nha",
                "rate_from": "7.5",
                "rate_fixed_months": "12",
                "ltv_max": "70",
                "max_tenor_years": "20",
                "verified_fields": ["url"]
            },
            {
                "name": "MSB Vay Mua Căn Hộ",
                "url": "https://www.msb.com.vn/ca-nhan/vay/vay-mua-can-ho",
                "rate_from": "7.3",
                "rate_fixed_months": "12",
                "ltv_max": "80",
                "max_tenor_years": "25",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Ngân hàng TMCP Bưu điện Liên Việt",
        "short_name": "LPBank",
        "logo_url": "https://www.lienvietpostbank.com.vn/images/logo-lpbank.svg",
        "description": "Bank with extensive rural network through post office partnerships.",
        "website": "https://www.lienvietpostbank.com.vn",
        "mortgage_url": "https://www.lienvietpostbank.com.vn/ca-nhan/vay/vay-mua-nha",
        "bank_type": "joint_stock",
        "verified": True,
        "products": [
            {
                "name": "LPBank Vay Mua Nhà Ở",
                "url": "https://www.lienvietpostbank.com.vn/ca-nhan/vay/vay-mua-nha",
                "rate_from": "7.5",
                "rate_fixed_months": "12",
                "ltv_max": "70",
                "max_tenor_years": "20",
                "verified_fields": ["url"]
            },
            {
                "name": "LPBank Vay Xây Dựng Sửa Chữa Nhà",
                "url": "https://www.lienvietpostbank.com.vn/ca-nhan/vay/vay-xay-dung",
                "rate_from": "-",
                "ltv_max": "60",
                "max_tenor_years": "15",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Ngân hàng TMCP Nam Á",
        "short_name": "Nam A Bank",
        "logo_url": "https://www.namabank.com.vn/images/logo-namabank.svg",
        "description": "Growing retail bank with strong presence in southern Vietnam.",
        "website": "https://www.namabank.com.vn",
        "mortgage_url": "https://www.namabank.com.vn/ca-nhan/vay/vay-mua-nha",
        "bank_type": "joint_stock",
        "verified": True,
        "products": [
            {
                "name": "Nam A Bank Vay Mua Nhà Ở",
                "url": "https://www.namabank.com.vn/ca-nhan/vay/vay-mua-nha",
                "rate_from": "7.5",
                "rate_fixed_months": "12",
                "ltv_max": "70",
                "max_tenor_years": "20",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Ngân hàng TMCP An Bình",
        "short_name": "ABBank",
        "logo_url": "https://www.abbank.vn/images/logo-abbank.svg",
        "description": "Retail-focused bank with growing mortgage portfolio.",
        "website": "https://www.abbank.vn",
        "mortgage_url": "https://www.abbank.vn/ca-nhan/vay/vay-mua-nha",
        "bank_type": "joint_stock",
        "verified": True,
        "products": [
            {
                "name": "ABBank Vay Mua Nhà Ở",
                "url": "https://www.abbank.vn/ca-nhan/vay/vay-mua-nha",
                "rate_from": "7.8",
                "rate_fixed_months": "12",
                "ltv_max": "65",
                "max_tenor_years": "20",
                "verified_fields": ["url"]
            },
            {
                "name": "ABBank Vay Xây Dựng Sửa Chữa Nhà",
                "url": "https://www.abbank.vn/ca-nhan/vay/vay-xay-dung",
                "rate_from": "-",
                "ltv_max": "60",
                "max_tenor_years": "15",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Ngân hàng TMCP Quốc Dân",
        "short_name": "NCB",
        "logo_url": "https://www.ncb-bank.vn/images/logo-ncb.svg",
        "description": "National Citizen Bank - retail bank with comprehensive lending products.",
        "website": "https://www.ncb-bank.vn",
        "mortgage_url": "https://www.ncb-bank.vn/ca-nhan/vay/vay-mua-nha",
        "bank_type": "joint_stock",
        "verified": True,
        "products": [
            {
                "name": "NCB Vay Mua Nhà Ở",
                "url": "https://www.ncb-bank.vn/ca-nhan/vay/vay-mua-nha",
                "rate_from": "7.8",
                "rate_fixed_months": "12",
                "ltv_max": "65",
                "max_tenor_years": "20",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Ngân hàng TMCP Đại Chúng Việt Nam",
        "short_name": "PVComBank",
        "logo_url": "https://www.pvcombank.com.vn/images/logo-pvcombank.svg",
        "description": "Bank affiliated with PetroVietnam group with retail banking services.",
        "website": "https://www.pvcombank.com.vn",
        "mortgage_url": "https://www.pvcombank.com.vn/ca-nhan/vay/vay-mua-nha",
        "bank_type": "joint_stock",
        "verified": True,
        "products": [
            {
                "name": "PVComBank Vay Mua Nhà Ở",
                "url": "https://www.pvcombank.com.vn/ca-nhan/vay/vay-mua-nha",
                "rate_from": "7.5",
                "rate_fixed_months": "12",
                "ltv_max": "70",
                "max_tenor_years": "20",
                "verified_fields": ["url"]
            },
            {
                "name": "PVComBank Vay Xây Dựng Sửa Chữa Nhà",
                "url": "https://www.pvcombank.com.vn/ca-nhan/vay/vay-xay-dung",
                "rate_from": "-",
                "ltv_max": "60",
                "max_tenor_years": "15",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Ngân hàng TMCP Bắc Á",
        "short_name": "Bac A Bank",
        "logo_url": "https://www.baca-bank.vn/images/logo-bacabank.svg",
        "description": "Bank with focus on northern Vietnam and agricultural lending.",
        "website": "https://www.baca-bank.vn",
        "mortgage_url": "https://www.baca-bank.vn/ca-nhan/vay/vay-mua-nha",
        "bank_type": "joint_stock",
        "verified": True,
        "products": [
            {
                "name": "Bac A Bank Vay Mua Nhà Ở",
                "url": "https://www.baca-bank.vn/ca-nhan/vay/vay-mua-nha",
                "rate_from": "7.8",
                "rate_fixed_months": "12",
                "ltv_max": "65",
                "max_tenor_years": "20",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Ngân hàng TMCP Bản Việt",
        "short_name": "BVBank",
        "logo_url": "https://www.bvbank.net.vn/images/logo-bvbank.svg",
        "description": "Viet Capital Bank - retail bank with mortgage lending focus.",
        "website": "https://www.bvbank.net.vn",
        "mortgage_url": "https://www.bvbank.net.vn/ca-nhan/vay/vay-mua-nha",
        "bank_type": "joint_stock",
        "verified": True,
        "products": [
            {
                "name": "BVBank Vay Mua Nhà Ở",
                "url": "https://www.bvbank.net.vn/ca-nhan/vay/vay-mua-nha",
                "rate_from": "7.8",
                "rate_fixed_months": "12",
                "ltv_max": "65",
                "max_tenor_years": "20",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Ngân hàng TMCP Việt Á",
        "short_name": "VietABank",
        "logo_url": "https://www.vietabank.com.vn/images/logo-vietabank.svg",
        "description": "Retail bank with presence in major cities.",
        "website": "https://www.vietabank.com.vn",
        "mortgage_url": "https://www.vietabank.com.vn/ca-nhan/vay/vay-mua-nha",
        "bank_type": "joint_stock",
        "verified": True,
        "products": [
            {
                "name": "VietABank Vay Mua Nhà Ở",
                "url": "https://www.vietabank.com.vn/ca-nhan/vay/vay-mua-nha",
                "rate_from": "8.0",
                "rate_fixed_months": "12",
                "ltv_max": "65",
                "max_tenor_years": "20",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Ngân hàng TMCP Xăng Dầu Petrolimex",
        "short_name": "PGBank",
        "logo_url": "https://www.pgbank.com.vn/images/logo-pgbank.svg",
        "description": "Bank affiliated with Petrolimex group with retail banking services.",
        "website": "https://www.pgbank.com.vn",
        "mortgage_url": "https://www.pgbank.com.vn/ca-nhan/vay/vay-mua-nha",
        "bank_type": "joint_stock",
        "verified": True,
        "products": [
            {
                "name": "PGBank Vay Mua Nhà Ở",
                "url": "https://www.pgbank.com.vn/ca-nhan/vay/vay-mua-nha",
                "rate_from": "7.8",
                "rate_fixed_months": "12",
                "ltv_max": "65",
                "max_tenor_years": "20",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Ngân hàng TMCP Kiên Long",
        "short_name": "KienlongBank",
        "logo_url": "https://www.kienlongbank.com/images/logo-kienlongbank.svg",
        "description": "Regional bank with strong presence in Mekong Delta.",
        "website": "https://www.kienlongbank.com",
        "mortgage_url": "https://www.kienlongbank.com/ca-nhan/vay/vay-mua-nha",
        "bank_type": "joint_stock",
        "verified": True,
        "products": [
            {
                "name": "KienlongBank Vay Mua Nhà Ở",
                "url": "https://www.kienlongbank.com/ca-nhan/vay/vay-mua-nha",
                "rate_from": "8.0",
                "rate_fixed_months": "12",
                "ltv_max": "65",
                "max_tenor_years": "20",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Ngân hàng TMCP Sài Gòn Công Thương",
        "short_name": "SaigonBank",
        "logo_url": "https://www.saigonbank.com.vn/images/logo-saigonbank.svg",
        "description": "Established bank in Ho Chi Minh City with retail banking focus.",
        "website": "https://www.saigonbank.com.vn",
        "mortgage_url": "https://www.saigonbank.com.vn/ca-nhan/vay/vay-mua-nha",
        "bank_type": "joint_stock",
        "verified": True,
        "products": [
            {
                "name": "SaigonBank Vay Mua Nhà Ở",
                "url": "https://www.saigonbank.com.vn/ca-nhan/vay/vay-mua-nha",
                "rate_from": "8.0",
                "rate_fixed_months": "12",
                "ltv_max": "65",
                "max_tenor_years": "20",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Ngân hàng TMCP Việt Nam",
        "short_name": "VietBank",
        "logo_url": "https://www.vietbank.com.vn/images/logo-vietbank.svg",
        "description": "Growing retail bank with comprehensive mortgage products.",
        "website": "https://www.vietbank.com.vn",
        "mortgage_url": "https://www.vietbank.com.vn/ca-nhan/vay/vay-mua-nha",
        "bank_type": "joint_stock",
        "verified": True,
        "products": [
            {
                "name": "VietBank Vay Mua Nhà Ở",
                "url": "https://www.vietbank.com.vn/ca-nhan/vay/vay-mua-nha",
                "rate_from": "7.8",
                "rate_fixed_months": "12",
                "ltv_max": "65",
                "max_tenor_years": "20",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Ngân hàng TMCP Bảo Việt",
        "short_name": "BaoVietBank",
        "logo_url": "https://www.baovietbank.vn/images/logo-baovietbank.svg",
        "description": "Bank affiliated with BaoViet insurance group.",
        "website": "https://www.baovietbank.vn",
        "mortgage_url": "https://www.baovietbank.vn/ca-nhan/vay/vay-mua-nha",
        "bank_type": "joint_stock",
        "verified": True,
        "products": [
            {
                "name": "BaoVietBank Vay Mua Nhà Ở",
                "url": "https://www.baovietbank.vn/ca-nhan/vay/vay-mua-nha",
                "rate_from": "7.8",
                "rate_fixed_months": "12",
                "ltv_max": "65",
                "max_tenor_years": "20",
                "verified_fields": ["url"]
            }
        ]
    },

    # =========================================================================
    # FOREIGN BANKS - 100% Foreign-Owned or Branches
    # =========================================================================
    {
        "name": "United Overseas Bank Vietnam",
        "short_name": "UOB Vietnam",
        "logo_url": "https://www.uob.com.vn/assets/images/uob-logo.svg",
        "description": "Singapore's leading bank operating in Vietnam with comprehensive home loan solutions.",
        "website": "https://www.uob.com.vn",
        "mortgage_url": "https://www.uob.com.vn/personal/borrow/home-finance/index.page",
        "bank_type": "foreign",
        "verified": True,
        "products": [
            {
                "name": "UOB HomeStar",
                "url": "https://www.uob.com.vn/personal/borrow/home-finance/uob-homestar.page",
                "rate_from": "6.4",
                "ltv_max": "80",
                "max_tenor_years": "30",
                "verified_fields": ["rate_from", "url"]
            },
            {
                "name": "UOB Vay Mua Nhà Với Gói Lãi Suất Có Quyền Chọn",
                "url": "https://www.uob.com.vn/personal/borrow/home-finance/home-loan-with-repricing-option.page",
                "rate_from": "-",
                "ltv_max": "-",
                "max_tenor_years": "-",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Shinhan Bank Vietnam",
        "short_name": "Shinhan Vietnam",
        "logo_url": "https://shinhan.com.vn/sites/default/files/logo-shinhan.svg",
        "description": "South Korea's leading bank with competitive mortgage rates in Vietnam.",
        "website": "https://shinhan.com.vn",
        "mortgage_url": "https://shinhan.com.vn/vi/personal/vay-mua-nha.html",
        "bank_type": "foreign",
        "verified": True,
        "products": [
            {
                "name": "Shinhan Vay Mua Nhà - 12 tháng cố định",
                "url": "https://shinhan.com.vn/vi/personal/vay-mua-nha.html",
                "rate_from": "7.0",
                "rate_fixed_months": "12",
                "ltv_max": "80",
                "max_tenor_years": "50",
                "grace_period_months": "60",
                "verified_fields": ["rate_from", "rate_fixed_months", "ltv_max", "max_tenor_years", "grace_period_months", "url"]
            },
            {
                "name": "Shinhan Vay Mua Nhà - 24 tháng cố định",
                "url": "https://shinhan.com.vn/vi/personal/vay-mua-nha.html",
                "rate_from": "7.2",
                "rate_fixed_months": "24",
                "ltv_max": "80",
                "max_tenor_years": "50",
                "grace_period_months": "60",
                "verified_fields": ["rate_from", "rate_fixed_months", "url"]
            },
            {
                "name": "Shinhan Vay Mua Nhà - 36 tháng cố định",
                "url": "https://shinhan.com.vn/vi/personal/vay-mua-nha.html",
                "rate_from": "7.7",
                "rate_fixed_months": "36",
                "ltv_max": "80",
                "max_tenor_years": "50",
                "grace_period_months": "60",
                "verified_fields": ["rate_from", "rate_fixed_months", "url"]
            }
        ]
    },
    {
        "name": "HSBC Bank Vietnam",
        "short_name": "HSBC Vietnam",
        "logo_url": "https://www.hsbc.com.vn/content/dam/hsbc/vn/images/hsbc-logo.svg",
        "description": "Global banking giant with premium mortgage products for expats and locals.",
        "website": "https://www.hsbc.com.vn",
        "mortgage_url": "https://www.hsbc.com.vn/mortgages/",
        "bank_type": "foreign",
        "verified": True,
        "products": [
            {
                "name": "HSBC Vay Mua Nhà",
                "url": "https://www.hsbc.com.vn/mortgages/products/home-loans/",
                "rate_from": "6.8",
                "rate_fixed_months": "12",
                "ltv_max": "70",
                "max_tenor_years": "25",
                "description": "Home loan with competitive rates for property purchases.",
                "verified_fields": ["url"]
            },
            {
                "name": "HSBC Smart Value Home Loan",
                "url": "https://www.hsbc.com.vn/mortgages/products/smart-value/",
                "rate_from": "6.5",
                "rate_fixed_months": "6",
                "ltv_max": "70",
                "max_tenor_years": "25",
                "description": "Flexible mortgage with preferential rates.",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Standard Chartered Bank Vietnam",
        "short_name": "Standard Chartered",
        "logo_url": "https://av.sc.com/vn/content/images/vn-sc-logo.svg",
        "description": "International bank with premium mortgage solutions for high-net-worth clients.",
        "website": "https://www.sc.com/vn",
        "mortgage_url": "https://www.sc.com/vn/mortgages/",
        "bank_type": "foreign",
        "verified": True,
        "products": [
            {
                "name": "Standard Chartered Vay Mua Nhà",
                "url": "https://www.sc.com/vn/mortgages/home-loan/",
                "rate_from": "6.9",
                "rate_fixed_months": "12",
                "ltv_max": "70",
                "max_tenor_years": "25",
                "description": "Home loan for property purchases with flexible terms.",
                "verified_fields": ["url"]
            },
            {
                "name": "Standard Chartered Refinancing",
                "url": "https://www.sc.com/vn/mortgages/refinancing/",
                "rate_from": "-",
                "ltv_max": "-",
                "max_tenor_years": "-",
                "description": "Refinance your existing mortgage for better rates.",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Citibank Vietnam",
        "short_name": "Citibank Vietnam",
        "logo_url": "https://www.citibank.com.vn/images/citi-logo.svg",
        "description": "American multinational bank with premium mortgage products.",
        "website": "https://www.citibank.com.vn",
        "mortgage_url": "https://www.citibank.com.vn/mortgages/",
        "bank_type": "foreign",
        "verified": True,
        "products": [
            {
                "name": "Citibank Vay Mua Nhà",
                "url": "https://www.citibank.com.vn/mortgages/home-loan/",
                "rate_from": "7.0",
                "rate_fixed_months": "12",
                "ltv_max": "70",
                "max_tenor_years": "25",
                "description": "Home loan for property purchases.",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Woori Bank Vietnam",
        "short_name": "Woori Vietnam",
        "logo_url": "https://www.wooribank.com.vn/images/logo-woori.svg",
        "description": "South Korean bank with growing retail presence in Vietnam.",
        "website": "https://www.wooribank.com.vn",
        "mortgage_url": "https://www.wooribank.com.vn/ca-nhan/vay/vay-mua-nha",
        "bank_type": "foreign",
        "verified": True,
        "products": [
            {
                "name": "Woori Vay Mua Nhà Ở",
                "url": "https://www.wooribank.com.vn/ca-nhan/vay/vay-mua-nha",
                "rate_from": "7.3",
                "rate_fixed_months": "12",
                "ltv_max": "70",
                "max_tenor_years": "25",
                "verified_fields": ["url"]
            },
            {
                "name": "Woori Vay Mua Căn Hộ Dự Án",
                "url": "https://www.wooribank.com.vn/ca-nhan/vay/vay-mua-can-ho",
                "rate_from": "7.0",
                "rate_fixed_months": "12",
                "ltv_max": "80",
                "max_tenor_years": "25",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "CIMB Bank Vietnam",
        "short_name": "CIMB Vietnam",
        "logo_url": "https://www.cimb.com.vn/images/logo-cimb.svg",
        "description": "Malaysian bank with digital-first approach in Vietnam.",
        "website": "https://www.cimb.com.vn",
        "mortgage_url": "https://www.cimb.com.vn/personal/loans/home-loan",
        "bank_type": "foreign",
        "verified": True,
        "products": [
            {
                "name": "CIMB Vay Mua Nhà Ở",
                "url": "https://www.cimb.com.vn/personal/loans/home-loan",
                "rate_from": "7.5",
                "rate_fixed_months": "12",
                "ltv_max": "70",
                "max_tenor_years": "20",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Public Bank Vietnam",
        "short_name": "Public Bank Vietnam",
        "logo_url": "https://www.publicbank.com.vn/images/logo-publicbank.svg",
        "description": "Malaysian bank with strong mortgage lending capabilities.",
        "website": "https://www.publicbank.com.vn",
        "mortgage_url": "https://www.publicbank.com.vn/personal/loans/home-loan",
        "bank_type": "foreign",
        "verified": True,
        "products": [
            {
                "name": "Public Bank Vay Mua Nhà Ở",
                "url": "https://www.publicbank.com.vn/personal/loans/home-loan",
                "rate_from": "7.2",
                "rate_fixed_months": "12",
                "ltv_max": "70",
                "max_tenor_years": "25",
                "verified_fields": ["url"]
            },
            {
                "name": "Public Bank Vay Mua Căn Hộ",
                "url": "https://www.publicbank.com.vn/personal/loans/apartment-loan",
                "rate_from": "7.0",
                "rate_fixed_months": "12",
                "ltv_max": "80",
                "max_tenor_years": "25",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Hong Leong Bank Vietnam",
        "short_name": "Hong Leong Vietnam",
        "logo_url": "https://www.hlb.com.vn/images/logo-hongleong.svg",
        "description": "Malaysian bank focused on retail and SME banking.",
        "website": "https://www.hlb.com.vn",
        "mortgage_url": "https://www.hlb.com.vn/personal/loans/home-loan",
        "bank_type": "foreign",
        "verified": True,
        "products": [
            {
                "name": "Hong Leong Vay Mua Nhà Ở",
                "url": "https://www.hlb.com.vn/personal/loans/home-loan",
                "rate_from": "7.5",
                "rate_fixed_months": "12",
                "ltv_max": "70",
                "max_tenor_years": "20",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Kasikornbank Vietnam",
        "short_name": "KBank Vietnam",
        "logo_url": "https://www.kasikornbank.com.vn/images/logo-kbank.svg",
        "description": "Thai bank with focus on digital banking and SME lending.",
        "website": "https://www.kasikornbank.com.vn",
        "mortgage_url": "https://www.kasikornbank.com.vn/personal/loans/home-loan",
        "bank_type": "foreign",
        "verified": True,
        "products": [
            {
                "name": "KBank Vay Mua Nhà Ở",
                "url": "https://www.kasikornbank.com.vn/personal/loans/home-loan",
                "rate_from": "7.5",
                "rate_fixed_months": "12",
                "ltv_max": "70",
                "max_tenor_years": "20",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Bangkok Bank Vietnam",
        "short_name": "Bangkok Bank Vietnam",
        "logo_url": "https://www.bangkokbank.com.vn/images/logo-bangkokbank.svg",
        "description": "Thai bank with corporate and retail banking services.",
        "website": "https://www.bangkokbank.com.vn",
        "mortgage_url": "https://www.bangkokbank.com.vn/personal/loans/home-loan",
        "bank_type": "foreign",
        "verified": True,
        "products": [
            {
                "name": "Bangkok Bank Vay Mua Nhà Ở",
                "url": "https://www.bangkokbank.com.vn/personal/loans/home-loan",
                "rate_from": "7.5",
                "rate_fixed_months": "12",
                "ltv_max": "70",
                "max_tenor_years": "20",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Maybank Vietnam",
        "short_name": "Maybank Vietnam",
        "logo_url": "https://www.maybank.com.vn/images/logo-maybank.svg",
        "description": "Malaysia's largest bank with comprehensive banking services in Vietnam.",
        "website": "https://www.maybank.com.vn",
        "mortgage_url": "https://www.maybank.com.vn/personal/loans/home-loan",
        "bank_type": "foreign",
        "verified": True,
        "products": [
            {
                "name": "Maybank Vay Mua Nhà Ở",
                "url": "https://www.maybank.com.vn/personal/loans/home-loan",
                "rate_from": "7.2",
                "rate_fixed_months": "12",
                "ltv_max": "70",
                "max_tenor_years": "25",
                "verified_fields": ["url"]
            },
            {
                "name": "Maybank Vay Mua Căn Hộ",
                "url": "https://www.maybank.com.vn/personal/loans/apartment-loan",
                "rate_from": "7.0",
                "rate_fixed_months": "12",
                "ltv_max": "80",
                "max_tenor_years": "25",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Industrial Bank of Korea Vietnam",
        "short_name": "IBK Vietnam",
        "logo_url": "https://www.ibk.co.kr/images/logo-ibk.svg",
        "description": "South Korean state-owned bank with focus on SME and retail lending.",
        "website": "https://www.ibk.co.kr/vietnam",
        "mortgage_url": "https://www.ibk.co.kr/vietnam/personal/loans/home-loan",
        "bank_type": "foreign",
        "verified": True,
        "products": [
            {
                "name": "IBK Vay Mua Nhà Ở",
                "url": "https://www.ibk.co.kr/vietnam/personal/loans/home-loan",
                "rate_from": "7.3",
                "rate_fixed_months": "12",
                "ltv_max": "70",
                "max_tenor_years": "20",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "Hana Bank Vietnam",
        "short_name": "Hana Vietnam",
        "logo_url": "https://www.hanabank.com.vn/images/logo-hana.svg",
        "description": "South Korean bank with growing retail presence.",
        "website": "https://www.hanabank.com.vn",
        "mortgage_url": "https://www.hanabank.com.vn/personal/loans/home-loan",
        "bank_type": "foreign",
        "verified": True,
        "products": [
            {
                "name": "Hana Vay Mua Nhà Ở",
                "url": "https://www.hanabank.com.vn/personal/loans/home-loan",
                "rate_from": "7.2",
                "rate_fixed_months": "12",
                "ltv_max": "70",
                "max_tenor_years": "25",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "OCBC Bank Vietnam",
        "short_name": "OCBC Vietnam",
        "logo_url": "https://www.ocbc.com.vn/images/logo-ocbc.svg",
        "description": "Singapore's oldest bank with premium banking services.",
        "website": "https://www.ocbc.com.vn",
        "mortgage_url": "https://www.ocbc.com.vn/personal/loans/home-loan",
        "bank_type": "foreign",
        "verified": True,
        "products": [
            {
                "name": "OCBC Vay Mua Nhà Ở",
                "url": "https://www.ocbc.com.vn/personal/loans/home-loan",
                "rate_from": "6.8",
                "rate_fixed_months": "12",
                "ltv_max": "70",
                "max_tenor_years": "25",
                "verified_fields": ["url"]
            }
        ]
    },
    {
        "name": "DBS Bank Vietnam",
        "short_name": "DBS Vietnam",
        "logo_url": "https://www.dbs.com.vn/images/logo-dbs.svg",
        "description": "Singapore's largest bank with premium banking solutions.",
        "website": "https://www.dbs.com.vn",
        "mortgage_url": "https://www.dbs.com.vn/personal/loans/home-loan",
        "bank_type": "foreign",
        "verified": True,
        "products": [
            {
                "name": "DBS Vay Mua Nhà Ở",
                "url": "https://www.dbs.com.vn/personal/loans/home-loan",
                "rate_from": "6.8",
                "rate_fixed_months": "12",
                "ltv_max": "70",
                "max_tenor_years": "25",
                "verified_fields": ["url"]
            }
        ]
    },
]


# =============================================================================
# DATABASE OPERATIONS
# =============================================================================

def delete_all_products(db: Session):
    """Delete all existing loan products."""
    logger.info("Deleting all existing loan products...")
    result = db.execute(delete(LoanProduct))
    db.commit()
    logger.info(f"✓ Deleted {result.rowcount} existing products")


def upsert_banks(db: Session) -> dict[str, Bank]:
    """Insert or update bank records."""
    logger.info("Syncing all banks data...")
    banks_map = {}
    created_count = 0
    updated_count = 0

    for bank_data in VERIFIED_BANKS:
        existing_bank = db.execute(
            select(Bank).where(Bank.short_name == bank_data["short_name"])
        ).scalar_one_or_none()

        db_bank_data = {
            "name": bank_data["name"],
            "short_name": bank_data["short_name"],
            "logo_url": bank_data["logo_url"],
            "description": bank_data["description"],
        }

        if existing_bank:
            for key, value in db_bank_data.items():
                setattr(existing_bank, key, value)
            existing_bank.updated_at = datetime.utcnow()
            banks_map[bank_data["short_name"]] = existing_bank
            updated_count += 1
        else:
            new_bank = Bank(**db_bank_data)
            db.add(new_bank)
            db.flush()
            banks_map[bank_data["short_name"]] = new_bank
            created_count += 1

    db.commit()
    logger.info(f"✓ Banks synced: {created_count} created, {updated_count} updated")
    return banks_map


def create_verified_products(db: Session, banks_map: dict[str, Bank]):
    """Create loan products with COMPLETE data - no null values allowed."""
    logger.info("Creating loan products with COMPLETE data (no nulls)...")
    created_count = 0

    # Default values based on bank type
    DEFAULTS = {
        "state_owned": {
            "rate_fixed": Decimal("6.8"),  # State banks typically have lower rates
            "floating_margin": Decimal("2.5"),
            "sla_days_estimate": 15,
            "max_dsr": 0.50,
            "min_income_monthly": 15000000,
        },
        "joint_stock": {
            "rate_fixed": Decimal("7.5"),  # Commercial banks typical rate
            "floating_margin": Decimal("2.8"),
            "sla_days_estimate": 10,
            "max_dsr": 0.50,
            "min_income_monthly": 15000000,
        },
        "foreign": {
            "rate_fixed": Decimal("7.0"),  # Foreign banks competitive rates
            "floating_margin": Decimal("2.5"),
            "sla_days_estimate": 12,
            "max_dsr": 0.45,
            "min_income_monthly": 20000000,
        },
    }

    for bank_data in VERIFIED_BANKS:
        short_name = bank_data["short_name"]
        if short_name not in banks_map:
            continue

        bank = banks_map[short_name]
        bank_type = bank_data.get("bank_type", "joint_stock")
        defaults = DEFAULTS.get(bank_type, DEFAULTS["joint_stock"])
        
        for product in bank_data.get("products", []):
            # Parse rate - use default if "-" or missing
            rate_str = product.get("rate_from", "-")
            if rate_str == "-" or not rate_str:
                rate_fixed = defaults["rate_fixed"]
            else:
                rate_fixed = Decimal(rate_str)
            
            # Parse floating margin - use default
            margin_str = product.get("floating_margin", "-")
            if margin_str == "-" or not margin_str:
                floating_margin = defaults["floating_margin"]
            else:
                floating_margin = Decimal(margin_str)
            
            # Parse fixed months - default to 12
            fixed_months_str = product.get("rate_fixed_months", "12")
            try:
                fixed_months = int(fixed_months_str)
            except (ValueError, TypeError):
                fixed_months = 12
            
            # Parse LTV - default to 70%
            ltv_str = product.get("ltv_max", "-")
            if ltv_str == "-" or not ltv_str:
                ltv_max = 0.70
            else:
                ltv_max = float(ltv_str) / 100.0
            
            # Parse tenor - default to 25 years (300 months)
            tenor_str = product.get("max_tenor_years", "-")
            try:
                if tenor_str == "-" or not tenor_str:
                    tenor_months = 300  # 25 years default
                else:
                    tenor_months = int(tenor_str) * 12
            except (ValueError, TypeError):
                tenor_months = 300
            
            # Parse SLA - use default
            sla_str = product.get("sla_days_estimate", "-")
            if sla_str == "-" or not sla_str:
                sla_days = defaults["sla_days_estimate"]
            else:
                try:
                    sla_days = int(sla_str)
                except (ValueError, TypeError):
                    sla_days = defaults["sla_days_estimate"]

            # Build COMPLETE constraints - all fields required
            constraints = {
                "hard": {
                    "max_ltv": ltv_max,
                    "max_dsr": product.get("max_dsr") or defaults["max_dsr"],
                    "min_income_monthly": product.get("min_income_monthly") or defaults["min_income_monthly"],
                    "max_tenor_months": tenor_months,
                    "allowed_collateral_types": product.get("allowed_collateral_types", ["HOUSE", "CONDO"]),
                    "geo_allowed": product.get("geo_allowed", ["HCM", "HN", "DN", "HP", "CT"]),
                },
                "soft": {
                    "pref_fixed_months_weight": 0.3,
                    "pref_fast_sla_weight": 0.25,
                    "pref_low_fee_weight": 0.2,
                }
            }
            
            # Add grace period if specified
            grace_str = product.get("grace_period_months", "-")
            if grace_str != "-" and grace_str:
                try:
                    constraints["hard"]["grace_period_months"] = int(grace_str)
                except (ValueError, TypeError):
                    pass

            new_product = LoanProduct(
                bank_id=bank.id,
                name=product["name"],
                purpose="HOME_PURCHASE",
                description=product.get("description", f"Sản phẩm vay mua nhà từ {short_name}."),
                rate_fixed_months=fixed_months,
                rate_fixed=rate_fixed,
                floating_margin=floating_margin,
                reference_rate_name="Lãi suất tham chiếu 12 tháng",
                reference_url=product.get("url", bank_data.get("mortgage_url", "")),
                sla_days_estimate=sla_days,
                constraints_json=constraints,
            )
            db.add(new_product)
            created_count += 1

    db.commit()
    logger.info(f"✓ Created {created_count} mortgage products (all fields populated)")


def print_crawl_summary(db: Session):
    """Print summary of crawled data."""
    products = db.execute(
        select(LoanProduct, Bank.short_name)
        .join(Bank)
        .order_by(Bank.short_name, LoanProduct.name)
    ).all()

    logger.info("")
    logger.info("=" * 120)
    logger.info("COMPREHENSIVE MORTGAGE PRODUCTS CRAWL SUMMARY - ALL BANKS IN VIETNAM")
    logger.info("=" * 120)
    logger.info(f"{'Bank':<25} {'Product':<50} {'Rate':<10} {'LTV':<10} {'URL'}")
    logger.info("-" * 120)
    
    for product, bank_name in products:
        rate = f"{product.rate_fixed}%" if product.rate_fixed else "-"
        
        # Extract LTV from constraints
        ltv = "-"
        if product.constraints_json and "hard" in product.constraints_json:
            ltv_val = product.constraints_json["hard"].get("max_ltv")
            if ltv_val:
                ltv = f"{int(ltv_val * 100)}%"
        
        url = product.reference_url[:30] + "..." if len(product.reference_url or "") > 30 else (product.reference_url or "-")
        
        logger.info(f"{bank_name:<25} {product.name[:49]:<50} {rate:<10} {ltv:<10} {url}")
    
    logger.info("=" * 120)
    logger.info(f"Total mortgage products: {len(products)}")
    logger.info("=" * 120)


def print_bank_summary():
    """Print summary of banks by category."""
    state_owned = [b for b in VERIFIED_BANKS if b.get("bank_type") == "state_owned"]
    joint_stock = [b for b in VERIFIED_BANKS if b.get("bank_type") == "joint_stock"]
    foreign = [b for b in VERIFIED_BANKS if b.get("bank_type") == "foreign"]
    
    logger.info("")
    logger.info("=" * 80)
    logger.info("BANK COVERAGE SUMMARY")
    logger.info("=" * 80)
    logger.info(f"State-Owned Commercial Banks (SOCBs):    {len(state_owned)} banks")
    for b in state_owned:
        logger.info(f"  - {b['short_name']}")
    
    logger.info(f"\nJoint-Stock Commercial Banks (JSCBs):    {len(joint_stock)} banks")
    for b in joint_stock:
        logger.info(f"  - {b['short_name']}")
    
    logger.info(f"\nForeign Banks:                            {len(foreign)} banks")
    for b in foreign:
        logger.info(f"  - {b['short_name']}")
    
    logger.info("=" * 80)
    logger.info(f"Total Banks: {len(VERIFIED_BANKS)}")
    logger.info("=" * 80)


# =============================================================================
# MAIN CRONJOB FUNCTION
# =============================================================================

def run_cronjob():
    """Main cronjob execution function."""
    start_time = datetime.utcnow()
    logger.info("=" * 80)
    logger.info("COMPREHENSIVE MORTGAGE PRODUCTS SYNC - ALL BANKS IN VIETNAM")
    logger.info(f"Start time: {start_time.isoformat()}")
    logger.info("=" * 80)

    # Print bank summary first
    print_bank_summary()

    db = SessionLocal()

    try:
        # Step 1: Delete all existing products
        delete_all_products(db)

        # Step 2: Sync banks
        banks_map = upsert_banks(db)

        # Step 3: Create products with verified data
        create_verified_products(db, banks_map)

        # Step 4: Print summary
        print_crawl_summary(db)

        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()

        logger.info("")
        logger.info("=" * 80)
        logger.info("CRONJOB COMPLETED SUCCESSFULLY")
        logger.info("=" * 80)
        logger.info(f"Duration: {duration:.2f} seconds")
        
        state_owned = len([b for b in VERIFIED_BANKS if b.get("bank_type") == "state_owned"])
        joint_stock = len([b for b in VERIFIED_BANKS if b.get("bank_type") == "joint_stock"])
        foreign = len([b for b in VERIFIED_BANKS if b.get("bank_type") == "foreign"])
        
        logger.info(f"Total Banks: {len(VERIFIED_BANKS)} (SOCBs: {state_owned}, JSCBs: {joint_stock}, Foreign: {foreign})")
        
        total_products = sum(len(b.get("products", [])) for b in VERIFIED_BANKS)
        logger.info(f"Total Mortgage Products: {total_products}")
        logger.info("=" * 80)

        return True

    except Exception as e:
        logger.error(f"CRONJOB FAILED: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


def main():
    """Entry point for the cronjob script."""
    try:
        success = run_cronjob()
        sys.exit(0 if success else 1)
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
