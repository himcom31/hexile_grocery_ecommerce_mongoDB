// src/components/AdminLayout.jsx
import { Routes, Route, Navigate } from "react-router-dom";

import React from 'react';
import Sidebar from './Sidebar';
import AdminLay from './Admindashboard';
import ProductList from "./Product Management/ProductList";
import CategoryPage from "./Admin/Categorypage";
import BrandPage from "./Admin/Brandpage";
import AddProductPage from "./Admin/Addproductpage";
import CreateFlashSale from "./Admin/CreateFlashSale";
import FlashSaleApp from "./Admin/Flashsaleapp";
import AddNewAd from "./Admin/Addnewad";
import AdsListPage from "./Admin/Adslistpage";
import CouponListPage from "./Admin/Couponlistpage";
import AddCouponPage from "./Admin/Addcouponpage";
import AddBlogPage from "./Admin/Addblogpage";
import BlogListPage from "./Admin/Bloglistpage";
import AddDriver from "./Admin/Adddriver";
import AllDrivers from "./Admin/Alldrivers";
import TaxManagement from "./Admin/Taxmanagement";
import DeliveryChargePage from "./Admin/Deliverychargepage";
import PaymentGatewaysPage from "./Admin/Config Dependecy/Paymentgatewayspage";
import SmsConfigPage from "./Admin/Config Dependecy/Smsconfigpage";
import SocialAuthPage from "./Admin/Config Dependecy/Socialauthpage";
import PusherConfiguration from "./Admin/Config Dependecy/Pusherconfiguration";
import MailConfigurationPage from "./Admin/Config Dependecy/Mailconfigurationpage";
import FirebaseNotificationPage from "./Admin/Config Dependecy/Firebasenotificationpage";
import PushNotificationPage from "./Admin/Pushnotificationpage";
import TicketIssueTypes from "./Admin/Tickettype";
import AllHelpRequests from "./Admin/Allhelprequests";
import SupportTicketDetail from "./Admin/Supportticketdetail";
import OrdersList from "./Admin/Orderslist";


const AdminLayout = () => {
  return (
    <div className="flex h-screen bg-[#F8F9FA]">
      {/* Fixed Sidebar */}
      <Sidebar />
      <main className="flex-1 p-10 overflow-y-auto">
        <Routes>
          <Route path="dash" element={<AdminLay />} />
          <Route path="productList" element={<ProductList />} />
          <Route path="category" element={<CategoryPage />} />
          <Route path="brandpage" element={<BrandPage />} />
          <Route path="addProducts" element={<AddProductPage />} />
          <Route path="addFlash" element={<CreateFlashSale />} />
          <Route path="viewflash" element={<FlashSaleApp />} />
          <Route path="addad" element={<AddNewAd />} />
          <Route path="adlist" element={<AdsListPage />} />
          <Route path="Addcoupan" element={<AddCouponPage />} />
          <Route path="coupanlist" element={<CouponListPage />} />
          <Route path="addBlogs" element={<AddBlogPage />} />
          <Route path="listBlog" element={< BlogListPage />} />
          <Route path="addDriver" element={< AddDriver />} />
          <Route path="allDriver" element={< AllDrivers />} />
          <Route path="texs" element={< TaxManagement />} />
          <Route path="deliveryCharge" element={< DeliveryChargePage />} />
          <Route path="paymentgateway" element={< PaymentGatewaysPage />} />
          <Route path="smsSetting" element={< SmsConfigPage />} />
          <Route path="socialAuth" element={<SocialAuthPage />} />
          <Route path="pusher" element={<PusherConfiguration />} />
          <Route path="mailConfig" element={<MailConfigurationPage />} />
          <Route path="firebase" element={<FirebaseNotificationPage />} />
          <Route path="pusernotication" element={<PushNotificationPage />} />
          <Route path="ticket_issue" element={<TicketIssueTypes />} />
          <Route path="support-tickets" element={<AllHelpRequests />} />
          <Route path="support-tickets/:id" element={<SupportTicketDetail />} />
          <Route path="Order-list" element={<OrdersList />} />

























        </Routes>
      </main>


    </div>
  );
};

export default AdminLayout;