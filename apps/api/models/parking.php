<?php include "commheader.php"; ?>
<main>
	<section>
		<h2>Parking Statuses</h2>
		<p>
			Below you can see an interactive map showing the status of each
			CCU parking lot.\nBus routes are included as well.
		</p>
	</section>
	<section>
		<h2>Select A Parking Lot</h2>
		<p>
			Use the dropdown menu to see a specific parking lot's data.\n
			To see a map of campus, click here: 
			<a href="https://www.coastal.edu/map/" target="_blank">Campus Map</a>
		</p>
		<!-- All info sections are hidden initially and become visible
			 when the user selects one. -->
		<?php include "dropdown.php"; ?>		
		<ul>
			<li></li>
		</ul>
	</section>
</main>
<?php include "commfooter.php"; ?>