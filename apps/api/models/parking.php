<?php include "commheader.php"; ?>
<main>
	<section>
		<h2>Parking Statuses</h2>
		<p>
			Below you can see an interactive map showing the status of each
			CCU parking lot.<br>Bus routes are included as well.
		</p>
	</section>
	<section>
		<h2>Select A Parking Lot</h2>
		<p>
			Use the dropdown menu to see a specific parking lot's data.<br>
			To see a map of campus, click here: 
			<a href="https://www.coastal.edu/map/" target="_blank">Campus Map</a>
		</p>
		<!-- All info sections are hidden initially and become visible
			 when the user selects one. -->
		<?php include "dropdown.php"; ?>		
		<section class="hidden">
			<h3>A Parking Lot</h3>
			<ul>
				<li>Location: circle in from of the Wall College of Business</li>
				<li>Closest Shuttle Stop: (Brittain Hall)</li>
			</ul>
			<ul>
		</section>
		<section class="hidden">
			<h3>AA Parking Lot</h3>
			<ul>
				<li>Location: Outside the HTC Center</li>
				<li>Closest Shuttle Stop: (Brittain Hall)</li>
				<li>Parking Type: Limited Time**</li>
			</ul>
		</section>
		<section class="hidden">
			<h3>B Parking Lot</h3>
			<ul>
				<li>Location: Outside Penny Hall (formerly Academic Office 2)</li>
				<li>Closest Shuttle Stop: (Brittain Hall)</li>
				<li>Parking Type: </li>
			</ul>
		</section>
		<section class="hidden">
			<h3>BB Parking Lot</h3>
			<ul>
				<li>Location:</li>
				<li>Closest Shuttle Stop:</li>
				<li>Parking Type:</li>
			</ul>
		</section>
	</section>
</main>
<?php include "commfooter.php"; ?>
